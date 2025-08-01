package k8s

import (
	"context"
	"fmt"
	"log"
	"math/rand"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"

	"github.com/cldmnky/pod-invaders/internal/game"
)

// GetPods retrieves a list of running pods from the specified namespaces.
// If not enough real pods are found, it supplements the list with fake pods.
func GetPods(client kubernetes.Interface, count int, namespaces ...string) ([]game.Pod, error) {
	pods := make([]game.Pod, 0, count)

	if len(namespaces) == 0 {
		namespaces = []string{"default"}
	}

	// Shuffle namespaces to randomize the search order
	rand.Shuffle(len(namespaces), func(i, j int) {
		namespaces[i], namespaces[j] = namespaces[j], namespaces[i]
	})

	for _, ns := range namespaces {
		if ns == "" {
			continue
		}

		// Verify the namespace exists, matching original functionality.
		_, err := client.CoreV1().Namespaces().Get(context.TODO(), ns, metav1.GetOptions{})
		if err != nil {
			log.Printf("Namespace %s does not exist or could not be retrieved, skipping: %v", ns, err)
			continue
		}

		log.Printf("Getting pods in namespace: %s", ns)
		podList, err := client.CoreV1().Pods(ns).List(context.TODO(), metav1.ListOptions{
			FieldSelector: "status.phase=Running",
		})
		if err != nil {
			log.Printf("Failed to list pods in namespace %s: %v. Skipping.", ns, err)
			continue
		}

		for _, pod := range podList.Items {
			// The FieldSelector handles the 'Running' phase, but we double-check for a deletion timestamp.
			if pod.DeletionTimestamp == nil {
				pods = append(pods, game.Pod{
					Name:      pod.Name,
					Namespace: pod.Namespace,
					IsRealPod: true,
				})
			}
		}
	}

	// If we have enough pods, shuffle and return the requested count
	if len(pods) >= count {
		rand.Shuffle(len(pods), func(i, j int) {
			pods[i], pods[j] = pods[j], pods[i]
		})
		return pods[:count], nil
	}

	// Otherwise, fill the rest with fake pods
	log.Printf("Found %d real pods, generating %d fake pods to reach count %d", len(pods), count-len(pods), count)
	for len(pods) < count {
		pods = append(pods, game.GenerateFakePod())
	}

	// Shuffle the final list
	rand.Shuffle(len(pods), func(i, j int) {
		pods[i], pods[j] = pods[j], pods[i]
	})

	return pods, nil
}

// KillPod deletes a real Kubernetes pod. It returns an error for fake pods.
func KillPod(client kubernetes.Interface, pod game.Pod) error {
	if !pod.IsRealPod {
		return fmt.Errorf("cannot kill fake pod: %s/%s", pod.Namespace, pod.Name)
	}

	log.Printf("Attempting to delete pod %s/%s", pod.Namespace, pod.Name)
	err := client.CoreV1().Pods(pod.Namespace).Delete(context.TODO(), pod.Name, metav1.DeleteOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete pod %s/%s: %w", pod.Namespace, pod.Name, err)
	}
	log.Printf("Successfully deleted pod %s/%s", pod.Namespace, pod.Name)
	return nil
}
