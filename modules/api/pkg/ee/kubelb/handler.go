//go:build ee

/*
                  Kubermatic Enterprise Read-Only License
                         Version 1.0 ("KERO-1.0")
                     Copyright © 2024 Kubermatic GmbH

   1.	You may only view, read and display for studying purposes the source
      code of the software licensed under this license, and, to the extent
      explicitly provided under this license, the binary code.
   2.	Any use of the software which exceeds the foregoing right, including,
      without limitation, its execution, compilation, copying, modification
      and distribution, is expressly prohibited.
   3.	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
      EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
      IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
      CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
      TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
      SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

   END OF TERMS AND CONDITIONS
*/

package kubelb

import (
	"context"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"sync"

	"github.com/gorilla/mux"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubelbv1alpha1 "k8c.io/kubelb/api/ee/kubelb.k8c.io/v1alpha1"
	v1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/tools/clientcmd"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

// Tenant includes additional metadata about a tenant
type Tenant struct {
	*apiv2.KubeLBTenant
}

type TenantMap map[string]*Tenant

// ListAllTenantsResponse defines the response format for tenant listings with errors
type ListAllTenantsResponse struct {
	Tenants       []*Tenant `json:"tenants"`
	Errors        []string  `json:"errors,omitempty"`
	ShowAll       bool      `json:"showAll"`
}

// listAllKubeLBTenantsReq is the request for listing all tenants across all seeds/datacenters
type listAllKubeLBTenantsReq struct {
	// in: path
	// required: true
	SeedName string `json:"seed_name"`
	// in: query
	// ShowAll shows all tenants regardless of cluster ID matching
	ShowAll bool `json:"show_all"`
}


// Request validation methods
// Validate validates listAllKubeLBTenantsReq request
func (req listAllKubeLBTenantsReq) Validate() error {
	if len(req.SeedName) == 0 {
		return fmt.Errorf("seed name cannot be empty")
	}
	return nil
}

// GetSeedCluster returns SeedCluster with the seed name
func (req listAllKubeLBTenantsReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		SeedName: req.SeedName,
	}
}

// TenantResult represents the result of collecting tenants from a location
type TenantResult struct {
	Tenants []*Tenant
	Error   error
}

// TenantAggregator manages concurrent tenant collection from multiple sources
type TenantAggregator struct {
	ctx               context.Context
	seedClient        ctrlruntimeclient.Client
	collectionResults chan TenantResult
	waitGroup         sync.WaitGroup
}

// NewTenantAggregator creates a new tenant collector
func NewTenantAggregator(ctx context.Context, seedClient ctrlruntimeclient.Client) *TenantAggregator {
	return &TenantAggregator{
		ctx:               ctx,
		seedClient:        seedClient,
		collectionResults: make(chan TenantResult, 50),
	}
}

// collects tenants from a seed
func (ta *TenantAggregator) CollectFromSeed(targetSeedName string, seed *v1.Seed) {
	ta.waitGroup.Add(1)
	go func() {
		defer ta.waitGroup.Done()

		seedTenantList, err := getListOfTenantsForSeed(ta.ctx, ta.seedClient, seed)
		if err != nil {
			ta.collectionResults <- TenantResult{
				Error: fmt.Errorf("seed %s: %w", targetSeedName, err),
			}
			return
		}

		var collectedTenants []*Tenant
		for _, seedTenant := range seedTenantList.Items {
			collectedTenants = append(collectedTenants, &Tenant{
				KubeLBTenant: convertInternalToAPITenant(&seedTenant),
			})
		}

		ta.collectionResults <- TenantResult{
			Tenants: collectedTenants,
		}
	}()
}

// collects tenants from a datacenter
func (ta *TenantAggregator) CollectFromDatacenter(parentSeedName, dcName string, parentSeed *v1.Seed, dc v1.Datacenter) {
	ta.waitGroup.Add(1)
	go func() {
		defer ta.waitGroup.Done()

		datacenterTenantList, err := getListOfTenantsForDatacenter(ta.ctx, ta.seedClient, parentSeed, dc)
		if err != nil {
			ta.collectionResults <- TenantResult{
				Error: fmt.Errorf("seed %s/dc %s: %w", parentSeedName, dcName, err),
			}
			return
		}

		var collectedTenants []*Tenant
		for _, datacenterTenant := range datacenterTenantList.Items {
			collectedTenants = append(collectedTenants, &Tenant{
				KubeLBTenant: convertInternalToAPITenant(&datacenterTenant),
			})
		}

		ta.collectionResults <- TenantResult{
			Tenants: collectedTenants,
		}
	}()
}

// Collect waits for all goroutines to complete and returns the aggregated results
func (ta *TenantAggregator) Collect() (TenantMap, []string) {
	// Close the channel once all workers finish
	go func() {
		ta.waitGroup.Wait()
		close(ta.collectionResults)
	}()

	aggregatedTenantsMap := make(TenantMap)
	var aggregateErrors []string

	// Collect all results
	for collectionResult := range ta.collectionResults {
		if collectionResult.Error != nil {
			aggregateErrors = append(aggregateErrors, collectionResult.Error.Error())
			continue
		}

		for _, collectedTenant := range collectionResult.Tenants {
			aggregatedTenantsMap[collectedTenant.Name] = collectedTenant
		}
	}

	return aggregatedTenantsMap, aggregateErrors
}

// Kubeconfig and client utilities
func getSeedKubeLBKubeconfigSecret(ctx context.Context, seedClient ctrlruntimeclient.Client, seed *v1.Seed) (*corev1.Secret, error) {
	if seed.Spec.KubeLB == nil || seed.Spec.KubeLB.Kubeconfig.Name == "" {
		return nil, fmt.Errorf("kubeLB management kubeconfig not found")
	}

	return getKubeconfigSecret(ctx, seedClient, 
		seed.Spec.KubeLB.Kubeconfig.Name,
		seed.Spec.KubeLB.Kubeconfig.Namespace,
		seed.Namespace)
}

func getDataCenterKubeLBKubeconfigSecret(ctx context.Context, seedClient ctrlruntimeclient.Client, parentSeed *v1.Seed, dc v1.Datacenter) (*corev1.Secret, error) {
	if dc.Spec.KubeLB == nil || dc.Spec.KubeLB.Kubeconfig.Name == "" {
		return nil, fmt.Errorf("kubeLB management kubeconfig not found")
	}

	return getKubeconfigSecret(ctx, seedClient,
		dc.Spec.KubeLB.Kubeconfig.Name,
		dc.Spec.KubeLB.Kubeconfig.Namespace,
		parentSeed.Namespace)
}

// Retrieves a kubeconfig secret with the given name and namespace
func getKubeconfigSecret(ctx context.Context, client ctrlruntimeclient.Client, name, namespace, defaultNamespace string) (*corev1.Secret, error) {
	kubeconfigSecret := &corev1.Secret{}
	kubeconfigSecretKey := metav1.NamespacedName{
		Namespace: namespace,
		Name:      name,
	}
	
	if kubeconfigSecretKey.Namespace == "" {
		kubeconfigSecretKey.Namespace = defaultNamespace
	}
	
	if err := client.Get(ctx, kubeconfigSecretKey, kubeconfigSecret); err != nil {
		return nil, fmt.Errorf("failed to get kubeconfig secret %q: %w", kubeconfigSecretKey.String(), err)
	}

	return kubeconfigSecret, nil
}


// Tenant listing functions
func getListOfTenantsForSeed(ctx context.Context, seedClient ctrlruntimeclient.Client, seed *v1.Seed) (*kubelbv1alpha1.TenantList, error) {
	seedKubeconfigSecret, err := getSeedKubeLBKubeconfigSecret(ctx, seedClient, seed)
	kubelbTenantList := &kubelbv1alpha1.TenantList{}

	if err != nil {
		return nil, err
	}

	kubelbClient, err := newKubeLBClientFromSecret(seedKubeconfigSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubelb client: %w", err)
	}

	if err := kubelbClient.List(ctx, kubelbTenantList); err != nil {
		return nil, fmt.Errorf("failed to list tenants: %w", err)
	}
	return kubelbTenantList, nil
}

func getListOfTenantsForDatacenter(ctx context.Context, seedClient ctrlruntimeclient.Client, parentSeed *v1.Seed, dc v1.Datacenter) (*kubelbv1alpha1.TenantList, error) {
	datacenterKubeconfigSecret, err := getDataCenterKubeLBKubeconfigSecret(ctx, seedClient, parentSeed, dc)
	kubelbTenantList := &kubelbv1alpha1.TenantList{}

	if err != nil {
		return nil, err
	}

	kubelbClient, err := newKubeLBClientFromSecret(datacenterKubeconfigSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubelb client: %w", err)
	}
	if err := kubelbClient.List(ctx, kubelbTenantList); err != nil {
		return nil, fmt.Errorf("failed to list tenants: %w", err)
	}
	return kubelbTenantList, nil
}

func newKubeLBClientFromSecret(secret *corev1.Secret) (ctrlruntimeclient.Client, error) {
	kc := secret.Data["kubeconfig"]
	if len(kc) == 0 {
		return nil, fmt.Errorf("no kubeconfig found")
	}
	parsed, err := clientcmd.Load(kc)
	if err != nil {
		return nil, fmt.Errorf("failed to parse kubeconfig: %w", err)
	}
	cfg, err := clientcmd.NewInteractiveClientConfig(*parsed, "", nil, nil, nil).ClientConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load kubeconfig: %w", err)
	}
	client, err := ctrlruntimeclient.New(cfg, ctrlruntimeclient.Options{})
	if err != nil {
		return nil, fmt.Errorf("failed to create client: %w", err)
	}
	return client, nil
}

// Data conversion utilities
func convertInternalToAPITenant(internalTenant *kubelbv1alpha1.Tenant) *apiv2.KubeLBTenant {
	return &apiv2.KubeLBTenant{
		ObjectMeta: apiv1.ObjectMeta{
			ID:                internalTenant.Name,
			Name:              internalTenant.Name,
			CreationTimestamp: apiv1.NewTime(internalTenant.CreationTimestamp.Time),
			DeletionTimestamp: func() *apiv1.Time {
				if internalTenant.DeletionTimestamp != nil {
					deletionTime := apiv1.NewTime(internalTenant.DeletionTimestamp.Time)
					return &deletionTime
				}
				return nil
			}(),
			Annotations: internalTenant.Annotations,
		},
		Spec: internalTenant.Spec,
	}
}

// aggregateTenantsForSeed collects tenants for a specific seed
func aggregateTenantsForSeed(ctx context.Context, seedClient ctrlruntimeclient.Client, seed *v1.Seed) (TenantMap, []string) {
	ta := NewTenantAggregator(ctx, seedClient)

	// Launch collection from seed
	if seed.Spec.KubeLB != nil && seed.Spec.KubeLB.Kubeconfig.Name != "" {
		ta.CollectFromSeed(seed.Name, seed)
	}

	// Launch collection from datacenters
	for datacenterName, datacenterConfig := range seed.Spec.Datacenters {
		if datacenterConfig.Spec.KubeLB != nil && datacenterConfig.Spec.KubeLB.Kubeconfig.Name != "" {
			ta.CollectFromDatacenter(seed.Name, datacenterName, seed, datacenterConfig)
		}
	}

	return ta.Collect()
}


// ListAllKubeLBTenants returns all KubeLB tenants across all seeds/datacenters for admin panel
func ListAllKubeLBTenants(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) (interface{}, error) {
	listTenantsRequest, ok := request.(listAllKubeLBTenantsReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	if err := listTenantsRequest.Validate(); err != nil {
		return nil, utilerrors.NewBadRequest(err.Error())
	}

	// Verify admin access
	currentUserInfo, err := userInfoGetter(ctx, "")
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	if !currentUserInfo.IsAdmin {
		return nil, utilerrors.New(403, "forbidden: admin access required")
	}

	availableSeeds, err := seedsGetter()
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	// Check if the seed exists
	requestedSeed, seedExists := availableSeeds[listTenantsRequest.SeedName]
	if !seedExists {
		return nil, utilerrors.NewNotFound("seed", listTenantsRequest.SeedName)
	}

	privilegedClusterProvider := ctx.Value(middleware.PrivilegedClusterProviderContextKey).(provider.PrivilegedClusterProvider)
	seedClusterClient := privilegedClusterProvider.GetSeedClusterAdminRuntimeClient()

	// Get cluster provider to fetch all clusters
	clusterProvider := ctx.Value(middleware.ClusterProviderContextKey).(provider.ClusterProvider)
	clusters, err := clusterProvider.ListAll(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to list clusters: %w", err)
	}

	// Collect cluster IDs into a set
	clusterIDs := make(map[string]struct{})
	for _, cluster := range clusters.Items {
		clusterIDs[cluster.Name] = struct{}{}
	}

	aggregatedTenantsMap, aggregationErrors := aggregateTenantsForSeed(ctx, seedClusterClient, requestedSeed)

	responseTenantsSlice := make([]*Tenant, 0, len(aggregatedTenantsMap))

	for _, t := range aggregatedTenantsMap {
		// Check if tenant name matches any cluster ID (default view)
		if !listTenantsRequest.ShowAll {
			// Only show tenants that match cluster IDs
			if _, exists := clusterIDs[t.Name]; exists {
				responseTenantsSlice = append(responseTenantsSlice, t)
			}
		} else {
			// Show all tenants
			responseTenantsSlice = append(responseTenantsSlice, t)
			if _, exists := clusterIDs[t.Name]; exists {
			}
		}
	}

	// Sort tenants by name for consistent responses
	sort.Slice(responseTenantsSlice, func(i, j int) bool {
		return responseTenantsSlice[i].Name < responseTenantsSlice[j].Name
	})

	return &ListAllTenantsResponse{
		Tenants:       responseTenantsSlice,
		Errors:        aggregationErrors,
		ShowAll:       listTenantsRequest.ShowAll,
	}, nil
}

// DecodeListAllKubeLBTenantsReq decodes the request for listing all tenants
func DecodeListAllKubeLBTenantsReq(c context.Context, r *http.Request) (interface{}, error) {
	var decodedRequest listAllKubeLBTenantsReq

	requestedSeedName := mux.Vars(r)["seed_name"]
	if requestedSeedName == "" {
		return nil, utilerrors.NewBadRequest("'seed_name' parameter is required but was not provided")
	}
	decodedRequest.SeedName = requestedSeedName
	
	showAll := r.URL.Query().Get("show_all")
	if strings.EqualFold(showAll, "true") {
		decodedRequest.ShowAll = true
	}
	
	return decodedRequest, nil
}
