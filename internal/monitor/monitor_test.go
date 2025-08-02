package monitor_test

import (
	"context"
	"net/http"
	"net/http/httptest"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/cldmnky/pod-invaders/internal/monitor"
)

var _ = Describe("Monitor", func() {
	var (
		manager    *monitor.Manager
		ctx        context.Context
		cancel     context.CancelFunc
		testServer *httptest.Server
	)

	BeforeEach(func() {
		manager = monitor.NewManager()
		ctx, cancel = context.WithCancel(context.Background())
	})

	AfterEach(func() {
		cancel()
		if testServer != nil {
			testServer.Close()
		}
	})

	Describe("NewManager", func() {
		It("should create a new manager with empty maps", func() {
			m := monitor.NewManager()
			Expect(m).NotTo(BeNil())
		})
	})

	Describe("Start", func() {
		It("should start monitoring a URL and return an ID", func() {
			testServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}))

			id, err := manager.Start(ctx, testServer.URL)
			Expect(err).NotTo(HaveOccurred())
			Expect(id).NotTo(BeEmpty())
			Expect(id).To(HaveLen(36)) // UUID length
		})

		It("should initialize status as unknown", func() {
			testServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}))

			id, err := manager.Start(ctx, testServer.URL)
			Expect(err).NotTo(HaveOccurred())

			status, err := manager.GetStatus(id)
			Expect(err).NotTo(HaveOccurred())
			Expect(status.Status).To(Equal("unknown"))
			Expect(status.URL).To(Equal(testServer.URL))
			Expect(status.ID).To(Equal(id))
		})

		It("should handle multiple monitors", func() {
			testServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}))

			id1, err := manager.Start(ctx, testServer.URL)
			Expect(err).NotTo(HaveOccurred())

			id2, err := manager.Start(ctx, testServer.URL)
			Expect(err).NotTo(HaveOccurred())

			Expect(id1).NotTo(Equal(id2))

			status1, err := manager.GetStatus(id1)
			Expect(err).NotTo(HaveOccurred())
			Expect(status1.ID).To(Equal(id1))

			status2, err := manager.GetStatus(id2)
			Expect(err).NotTo(HaveOccurred())
			Expect(status2.ID).To(Equal(id2))
		})
	})

	Describe("GetStatus", func() {
		Context("when monitor exists", func() {
			It("should return the status", func() {
				testServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.WriteHeader(http.StatusOK)
				}))

				id, err := manager.Start(ctx, testServer.URL)
				Expect(err).NotTo(HaveOccurred())

				status, err := manager.GetStatus(id)
				Expect(err).NotTo(HaveOccurred())
				Expect(status).NotTo(BeNil())
				Expect(status.ID).To(Equal(id))
				Expect(status.URL).To(Equal(testServer.URL))
			})

			It("should return a copy of the status", func() {
				testServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.WriteHeader(http.StatusOK)
				}))

				id, err := manager.Start(ctx, testServer.URL)
				Expect(err).NotTo(HaveOccurred())

				status1, err := manager.GetStatus(id)
				Expect(err).NotTo(HaveOccurred())

				status2, err := manager.GetStatus(id)
				Expect(err).NotTo(HaveOccurred())

				// They should have the same values but be different objects
				Expect(status1).To(Equal(status2))
				Expect(status1).NotTo(BeIdenticalTo(status2))
			})
		})

		Context("when monitor does not exist", func() {
			It("should return an error", func() {
				status, err := manager.GetStatus("non-existent-id")
				Expect(err).To(HaveOccurred())
				Expect(status).To(BeNil())
				Expect(err.Error()).To(ContainSubstring("monitor status for ID non-existent-id not found"))
			})
		})
	})

	Describe("Stop", func() {
		Context("when monitor exists", func() {
			It("should stop the monitor and remove it", func() {
				testServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.WriteHeader(http.StatusOK)
				}))

				id, err := manager.Start(ctx, testServer.URL)
				Expect(err).NotTo(HaveOccurred())

				// Verify it exists
				status, err := manager.GetStatus(id)
				Expect(err).NotTo(HaveOccurred())
				Expect(status).NotTo(BeNil())

				// Stop it
				err = manager.Stop(id)
				Expect(err).NotTo(HaveOccurred())

				// Verify it's gone
				status, err = manager.GetStatus(id)
				Expect(err).To(HaveOccurred())
				Expect(status).To(BeNil())
			})
		})

		Context("when monitor does not exist", func() {
			It("should return an error", func() {
				err := manager.Stop("non-existent-id")
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("monitor with ID non-existent-id not found"))
			})
		})
	})

	Describe("Monitoring behavior", func() {
		Context("when URL returns 2xx status", func() {
			It("should update status to 'up'", func() {
				testServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.WriteHeader(http.StatusOK)
				}))

				id, err := manager.Start(ctx, testServer.URL)
				Expect(err).NotTo(HaveOccurred())

				// Wait for at least one monitoring cycle
				Eventually(func() string {
					status, err := manager.GetStatus(id)
					if err != nil {
						return ""
					}
					return status.Status
				}, "6s", "100ms").Should(Equal("up"))
			})
		})

		Context("when URL returns 3xx status", func() {
			It("should update status to 'up'", func() {
				testServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.WriteHeader(http.StatusFound)
				}))

				id, err := manager.Start(ctx, testServer.URL)
				Expect(err).NotTo(HaveOccurred())

				// Wait for at least one monitoring cycle
				Eventually(func() string {
					status, err := manager.GetStatus(id)
					if err != nil {
						return ""
					}
					return status.Status
				}, "6s", "100ms").Should(Equal("up"))
			})
		})

		Context("when URL returns 4xx status", func() {
			It("should update status to 'up'", func() {
				testServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.WriteHeader(http.StatusNotFound)
				}))

				id, err := manager.Start(ctx, testServer.URL)
				Expect(err).NotTo(HaveOccurred())

				// Wait for at least one monitoring cycle
				Eventually(func() string {
					status, err := manager.GetStatus(id)
					if err != nil {
						return ""
					}
					return status.Status
				}, "6s", "100ms").Should(Equal("up"))
			})
		})

		Context("when URL returns 5xx status", func() {
			It("should update status to 'down'", func() {
				testServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.WriteHeader(http.StatusInternalServerError)
				}))

				id, err := manager.Start(ctx, testServer.URL)
				Expect(err).NotTo(HaveOccurred())

				// Wait for at least one monitoring cycle
				Eventually(func() string {
					status, err := manager.GetStatus(id)
					if err != nil {
						return ""
					}
					return status.Status
				}, "6s", "100ms").Should(Equal("down"))
			})
		})

		Context("when URL is unreachable", func() {
			It("should update status to 'down'", func() {
				// Use a non-existent URL
				unreachableURL := "http://localhost:99999"

				id, err := manager.Start(ctx, unreachableURL)
				Expect(err).NotTo(HaveOccurred())

				// Wait for at least one monitoring cycle
				Eventually(func() string {
					status, err := manager.GetStatus(id)
					if err != nil {
						return ""
					}
					return status.Status
				}, "6s", "100ms").Should(Equal("down"))
			})
		})

		Context("when context is cancelled", func() {
			It("should stop monitoring", func() {
				testServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.WriteHeader(http.StatusOK)
				}))

				monitorCtx, monitorCancel := context.WithCancel(ctx)
				id, err := manager.Start(monitorCtx, testServer.URL)
				Expect(err).NotTo(HaveOccurred())

				// Wait for initial status update
				Eventually(func() string {
					status, err := manager.GetStatus(id)
					if err != nil {
						return ""
					}
					return status.Status
				}, "6s", "100ms").Should(Equal("up"))

				// Cancel the context
				monitorCancel()

				// The monitor should still exist in the manager (only Stop() removes it)
				status, err := manager.GetStatus(id)
				Expect(err).NotTo(HaveOccurred())
				Expect(status).NotTo(BeNil())
			})
		})
	})

	Describe("Concurrent access", func() {
		It("should handle concurrent operations safely", func() {
			testServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}))

			const numMonitors = 5
			ids := make([]string, numMonitors)
			idChan := make(chan string, numMonitors)

			// Start multiple monitors concurrently
			startDone := make(chan bool, numMonitors)
			for i := 0; i < numMonitors; i++ {
				go func() {
					defer GinkgoRecover()
					id, err := manager.Start(ctx, testServer.URL)
					Expect(err).NotTo(HaveOccurred())
					idChan <- id
					startDone <- true
				}()
			}

			// Wait for all starts to complete and collect IDs
			for i := 0; i < numMonitors; i++ {
				<-startDone
				ids[i] = <-idChan
			}

			Expect(len(ids)).To(Equal(numMonitors))

			// Verify all monitors are accessible
			for _, id := range ids {
				status, err := manager.GetStatus(id)
				Expect(err).NotTo(HaveOccurred())
				Expect(status).NotTo(BeNil())
			}

			// Stop all monitors concurrently
			stopDone := make(chan bool, numMonitors)
			for _, id := range ids {
				go func(monitorID string) {
					defer GinkgoRecover()
					err := manager.Stop(monitorID)
					Expect(err).NotTo(HaveOccurred())
					stopDone <- true
				}(id)
			}

			// Wait for all stops to complete
			for i := 0; i < numMonitors; i++ {
				<-stopDone
			}

			// Verify all monitors are gone
			for _, id := range ids {
				status, err := manager.GetStatus(id)
				Expect(err).To(HaveOccurred())
				Expect(status).To(BeNil())
			}
		})
	})
})
