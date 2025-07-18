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
	"encoding/json"
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
	kubelbv1alpha1 "k8c.io/kubelb/api/kubelb.k8c.io/v1alpha1"
	v1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
	metav1 "k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/tools/clientcmd"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

// swagger:parameters listSeedKubeLBTenants
type listSeedKubeLBTenantsReq struct {
	// in: path
	// required: true
	SeedName string `json:"seed_name"`
}

type getKubeLBTenantsReq struct {
	listSeedKubeLBTenantsReq
	// in: path
	// required: true
	DC string `json:"dc"`
	// in: path
	// required: true
	TenantName string `json:"tenant_name"`
}

type patchKubeLBTenantsReq struct {
	getKubeLBTenantsReq
	// in: body
	// required: true
	Body kubelbv1alpha1.TenantSpec `json:"body"`
}

func (req listSeedKubeLBTenantsReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		SeedName: req.SeedName,
	}
}

func ListKubeLBTenants(ctx context.Context, request interface{}, seedsGetter provider.SeedsGetter) (interface{}, error) {
	req, ok := request.(listSeedKubeLBTenantsReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}
	privilegedClusterProvider := ctx.Value(middleware.PrivilegedClusterProviderContextKey).(provider.PrivilegedClusterProvider)
	seedClient := privilegedClusterProvider.GetSeedClusterAdminRuntimeClient()
	seeds, err := seedsGetter()
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	tenantsMap := make(map[string]*apiv2.KubeLBTenant)
	seed := seeds[req.SeedName]
	if seed.Spec.KubeLB != nil && seed.Spec.KubeLB.Kubeconfig.Name != "" {
		seedTenants, err := getListOfTenantsForSeed(ctx, seedClient, seed)
		if err != nil {
			return nil, err
		}
		for _, tenant := range seedTenants.Items {
			tenantsMap[tenant.Name] = convertInternalToAPITenant(&tenant)
		}
	}
	dataCenters := seed.Spec.Datacenters
	for _, dataCenter := range dataCenters {
		dcTenants, err := getListOfTenantsForDatacenter(ctx, seedClient, seed, dataCenter)
		if err != nil {
			continue
		}
		for _, tenant := range dcTenants.Items {
			if _, exists := tenantsMap[tenant.Name]; !exists {
				tenantsMap[tenant.Name] = convertInternalToAPITenant(&tenant)
			}
		}
	}

	return tenantsMap, nil
}

func DecodeListKubeLBTenantsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req listSeedKubeLBTenantsReq
	Seedname := mux.Vars(r)["seed_name"]
	if Seedname == "" {
		return nil, utilerrors.NewBadRequest("'seed_name' parameter is required but was not provided")
	}
	req.SeedName = Seedname
	return req, nil
}

func GetKubeLBTenants(ctx context.Context, request interface{}, seedsGetter provider.SeedsGetter) (interface{}, error) {
	req, ok := request.(getKubeLBTenantsReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}
	privilegedClusterProvider := ctx.Value(middleware.PrivilegedClusterProviderContextKey).(provider.PrivilegedClusterProvider)
	seedClient := privilegedClusterProvider.GetSeedClusterAdminRuntimeClient()
	seeds, err := seedsGetter()
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	seed := seeds[req.SeedName]
	dc := seed.Spec.Datacenters[req.DC]
	secret, err := getDataCenterKubeLBKubeconfigSecret(ctx, seedClient, seed, dc)

	if err != nil {
		return nil, fmt.Errorf("failed to get kubeLB secret: %w", err)
	}

	kubeLBManagerKubeconfig := secret.Data["kubeconfig"]
	if len(kubeLBManagerKubeconfig) == 0 {
		return nil, fmt.Errorf("no kubeconfig found")
	}

	kubeLBKubeconfig, err := clientcmd.Load(kubeLBManagerKubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to parse kubeconfig: %w", err)
	}
	cfg, err := clientcmd.NewInteractiveClientConfig(*kubeLBKubeconfig, "", nil, nil, nil).ClientConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load kubeconfig: %w", err)
	}
	client, err := ctrlruntimeclient.New(cfg, ctrlruntimeclient.Options{})
	tenant := &kubelbv1alpha1.Tenant{}
	namespacedName := types.NamespacedName{
		Namespace: seed.Namespace,
		Name:      req.TenantName,
	}
	if err := client.Get(ctx, namespacedName, tenant); err != nil {
		return nil, fmt.Errorf("failed to get tenant%s: %w", err)
	}

	return tenant, nil
}

func DecodeGetKubeLBTenantsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req getKubeLBTenantsReq
	Seedname := mux.Vars(r)["seed_name"]
	if Seedname == "" {
		return nil, utilerrors.NewBadRequest("'seed_name' parameter is required but was not provided")
	}

	dc := mux.Vars(r)["dc"]
	if dc == "" {
		return nil, utilerrors.NewBadRequest("'dc' parameter is required but was not provided")
	}

	TenantName := mux.Vars(r)["tenant_name"]
	if TenantName == "" {
		return nil, utilerrors.NewBadRequest("'tenant_name' parameter is required but was not provided")
	}

	req.SeedName = Seedname
	req.DC = dc
	req.TenantName = TenantName
	return req, nil
}

func PatchKubeLBTenants(ctx context.Context, request interface{}, seedsGetter provider.SeedsGetter) (interface{}, error) {
	req, ok := request.(patchKubeLBTenantsReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	privilegedClusterProvider := ctx.Value(middleware.PrivilegedClusterProviderContextKey).(provider.PrivilegedClusterProvider)
	seedClient := privilegedClusterProvider.GetSeedClusterAdminRuntimeClient()
	seeds, err := seedsGetter()
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	seed := seeds[req.SeedName]
	dc := seed.Spec.Datacenters[req.DC]
	secret, err := getDataCenterKubeLBKubeconfigSecret(ctx, seedClient, seed, dc)

	if err != nil {
		return nil, fmt.Errorf("failed to get kubeLB secret: %w", err)
	}

	kubeLBManagerKubeconfig := secret.Data["kubeconfig"]
	if len(kubeLBManagerKubeconfig) == 0 {
		return nil, fmt.Errorf("no kubeconfig found")
	}

	kubeLBKubeconfig, err := clientcmd.Load(kubeLBManagerKubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to parse kubeconfig: %w", err)
	}
	cfg, err := clientcmd.NewInteractiveClientConfig(*kubeLBKubeconfig, "", nil, nil, nil).ClientConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load kubeconfig: %w", err)
	}
	client, err := ctrlruntimeclient.New(cfg, ctrlruntimeclient.Options{})
	existingTenant := &kubelbv1alpha1.Tenant{}
	namespacedName := types.NamespacedName{
		Namespace: seed.Namespace,
		Name:      req.TenantName,
	}
	if err := client.Get(ctx, namespacedName, existingTenant); err != nil {
		return nil, fmt.Errorf("failed to get tenant%s: %w", err)
	}
	updatedTenant := existingTenant
	updatedTenant.Spec = req.Body

	if err := client.Patch(ctx, updatedTenant, ctrlruntimeclient.MergeFrom(existingTenant)); err != nil {
		return nil, fmt.Errorf("failed to patch tenant%s: %w", err)
	}

	return updatedTenant, nil
}

func DecodePatchKubeLBTenantsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req patchKubeLBTenantsReq
	Seedname := mux.Vars(r)["seed_name"]
	if Seedname == "" {
		return nil, utilerrors.NewBadRequest("'seed_name' parameter is required but was not provided")
	}

	dc := mux.Vars(r)["dc"]
	if dc == "" {
		return nil, utilerrors.NewBadRequest("'dc' parameter is required but was not provided")
	}

	TenantName := mux.Vars(r)["tenant_name"]
	if TenantName == "" {
		return nil, utilerrors.NewBadRequest("'tenant_name' parameter is required but was not provided")
	}

	req.SeedName = Seedname
	req.DC = dc
	req.TenantName = TenantName
	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}
	return req, nil
}

func getListOfTenantsForSeed(ctx context.Context, seedClient ctrlruntimeclient.Client, seed *v1.Seed) (*kubelbv1alpha1.TenantList, error) {
	secret, err := getSeedKubeLBKubeconfigSecret(ctx, seedClient, seed)
	tenantList := &kubelbv1alpha1.TenantList{}

	if err != nil {
		return nil, err
	}

	kubeLBManagerKubeconfig := secret.Data["kubeconfig"]
	if len(kubeLBManagerKubeconfig) == 0 {
		return nil, fmt.Errorf("no kubeconfig found")
	}
	kubeLBKubeconfig, err := clientcmd.Load(kubeLBManagerKubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to parse kubeconfig: %w", err)
	}

	cfg, err := clientcmd.NewInteractiveClientConfig(*kubeLBKubeconfig, "", nil, nil, nil).ClientConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load kubeconfig: %w", err)
	}

	client, err := ctrlruntimeclient.New(cfg, ctrlruntimeclient.Options{})

	if err := client.List(ctx, tenantList); err != nil {
		return nil, fmt.Errorf("failed to list tenants: %w", err)
	}
	return tenantList, nil
}

func getListOfTenantsForDatacenter(ctx context.Context, seedClient ctrlruntimeclient.Client, seed *v1.Seed, dc v1.Datacenter) (*kubelbv1alpha1.TenantList, error) {
	secret, err := getDataCenterKubeLBKubeconfigSecret(ctx, seedClient, seed, dc)
	tenantList := &kubelbv1alpha1.TenantList{}

	if err != nil {
		return nil, err
	}
	kubeLBManagerKubeconfig := secret.Data["kubeconfig"]
	if len(kubeLBManagerKubeconfig) == 0 {
		return nil, fmt.Errorf("no kubeconfig found")
	}
	kubeLBKubeconfig, err := clientcmd.Load(kubeLBManagerKubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to parse kubeconfig: %w", err)
	}

	cfg, err := clientcmd.NewInteractiveClientConfig(*kubeLBKubeconfig, "", nil, nil, nil).ClientConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load kubeconfig: %w", err)
	}

	client, err := ctrlruntimeclient.New(cfg, ctrlruntimeclient.Options{})

	if err := client.List(ctx, tenantList); err != nil {
		return nil, fmt.Errorf("failed to list tenants: %w", err)

	}
	return tenantList, nil
}

func getSeedKubeLBKubeconfigSecret(ctx context.Context, client ctrlruntimeclient.Client, seed *v1.Seed) (*corev1.Secret, error) {
	var name, namespace string

	if seed.Spec.KubeLB != nil && seed.Spec.KubeLB.Kubeconfig.Name != "" {
		name = seed.Spec.KubeLB.Kubeconfig.Name
		namespace = seed.Spec.KubeLB.Kubeconfig.Namespace
	} else {
		return nil, fmt.Errorf("kubeLB management kubeconfig not found")
	}

	secret := &corev1.Secret{}
	resourceName := metav1.NamespacedName{
		Namespace: namespace,
		Name:      name,
	}
	if resourceName.Namespace == "" {
		resourceName.Namespace = seed.Namespace
	}
	if err := client.Get(ctx, resourceName, secret); err != nil {
		return nil, fmt.Errorf("failed to get kubeconfig secret %q: %w", resourceName.String(), err)
	}

	return secret, nil
}

func getDataCenterKubeLBKubeconfigSecret(ctx context.Context, client ctrlruntimeclient.Client, seed *v1.Seed, dc v1.Datacenter) (*corev1.Secret, error) {
	var name, namespace string

	if dc.Spec.KubeLB != nil && dc.Spec.KubeLB.Kubeconfig.Name != "" {
		name = dc.Spec.KubeLB.Kubeconfig.Name
		namespace = dc.Spec.KubeLB.Kubeconfig.Namespace
	} else {
		return nil, fmt.Errorf("kubeLB management kubeconfig not found")
	}

	secret := &corev1.Secret{}
	resourceName := metav1.NamespacedName{
		Namespace: namespace,
		Name:      name,
	}
	if resourceName.Namespace == "" {
		resourceName.Namespace = seed.Namespace
	}
	if err := client.Get(ctx, resourceName, secret); err != nil {
		return nil, fmt.Errorf("failed to get kubeconfig secret %q: %w", resourceName.String(), err)
	}
	return secret, nil
}

func convertInternalToAPITenant(tenant *kubelbv1alpha1.Tenant) *apiv2.KubeLBTenant {
	return &apiv2.KubeLBTenant{
		ObjectMeta: apiv1.ObjectMeta{
			ID:                tenant.Name,
			Name:              tenant.Name,
			CreationTimestamp: apiv1.NewTime(tenant.CreationTimestamp.Time),
			DeletionTimestamp: func() *apiv1.Time {
				if tenant.DeletionTimestamp != nil {
					dt := apiv1.NewTime(tenant.DeletionTimestamp.Time)
					return &dt
				}
				return nil
			}(),
			Annotations: tenant.Annotations,
		},
		Spec: apiv2.KubeLBTenantSpec{
			LoadBalancer: &apiv2.LoadBalancerConfig{},
			Ingress:     &apiv2.IngressConfig{},
			GatewayAPI:  &apiv2.GatewayAPIConfig{},
		},
		Status: apiv2.KubeLBTenantStatus{},
	}
}

// Dashboard Endpoints

// listAllKubeLBTenantsReq is the request for listing all tenants across all seeds/datacenters
type listAllKubeLBTenantsReq struct {
	// in: path
	// required: true
	SeedName string `json:"seed_name"`
	// in: query
	// ShowAll shows all tenants regardless of cluster ID matching
	ShowAll bool `json:"show_all"`
}

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

// TenantWithMetadata includes additional metadata about a tenant
type TenantWithMetadata struct {
	*apiv2.KubeLBTenant
	Location   string   // seed/datacenter location information
	ClusterIDs []string // associated cluster IDs for project view
}

// listProjectKubeLBTenantsReq is the request for listing tenants for a specific project
type listProjectKubeLBTenantsReq struct {
	// in: path
	// required: true
	ProjectID string `json:"project_id"`
	// in: path
	// required: true
	SeedName string `json:"seed_name"`
	// in: query
	// ShowAll shows all tenants regardless of cluster ID matching
	ShowAll bool `json:"show_all"`
}

// Validate validates listProjectKubeLBTenantsReq request
func (req listProjectKubeLBTenantsReq) Validate() error {
	if len(req.SeedName) == 0 {
		return fmt.Errorf("seed name cannot be empty")
	}
	if len(req.ProjectID) == 0 {
		return fmt.Errorf("project ID cannot be empty")
	}
	return nil
}

// GetSeedCluster returns SeedCluster with the seed name
func (req listProjectKubeLBTenantsReq) GetSeedCluster() apiv1.SeedCluster {
	return apiv1.SeedCluster{
		SeedName: req.SeedName,
	}
}

// patchDashboardKubeLBTenantReq is the request for patching a tenant from the dashboard
type patchDashboardKubeLBTenantReq struct {
	// in: path
	// required: true
	TenantName string `json:"tenant_name"`
	// in: body
	// required: true
	Body kubelbv1alpha1.TenantSpec `json:"body"`
}

// ListAllTenantsResponse defines the response format for tenant listings with errors
type ListAllTenantsResponse struct {
	Tenants      []*TenantWithMetadata `json:"tenants"`
	Errors       []string              `json:"errors,omitempty"`
	TotalCount   int                   `json:"totalCount"`
	MatchingCount int                  `json:"matchingCount"`
	ShowAll      bool                  `json:"showAll"`
}

type ListProjectTenantsResponse struct {
	Tenants      []*TenantWithMetadata `json:"tenants"`
	Errors       []string              `json:"errors,omitempty"`
	TotalCount   int                   `json:"totalCount"`
	MatchingCount int                  `json:"matchingCount"`
	ShowAll      bool                  `json:"showAll"`
}

// Helper function to merge two string slices uniquely
func mergeStringSlices(a, b []string) []string {
	set := make(map[string]struct{})
	for _, s := range a {
		set[s] = struct{}{}
	}
	for _, s := range b {
		set[s] = struct{}{}
	}
	result := make([]string, 0, len(set))
	for s := range set {
		result = append(result, s)
	}
	return result
}

// TenantCollectionResult represents the result of collecting tenants from a location
type TenantCollectionResult struct {
	Tenants  []*TenantWithMetadata
	Location string
	Error    error
}

// TenantCollector manages concurrent tenant collection from multiple sources
type TenantCollector struct {
	ctx        context.Context
	seedClient ctrlruntimeclient.Client
	resultsCh  chan TenantCollectionResult
	wg         sync.WaitGroup
}

// NewTenantCollector creates a new tenant collector
func NewTenantCollector(ctx context.Context, seedClient ctrlruntimeclient.Client) *TenantCollector {
	return &TenantCollector{
		ctx:        ctx,
		seedClient: seedClient,
		resultsCh:  make(chan TenantCollectionResult, 50),
	}
}

// CollectFromSeed collects tenants from a seed
func (tc *TenantCollector) CollectFromSeed(seedName string, seed *v1.Seed) {
	tc.wg.Add(1)
	go func() {
		defer tc.wg.Done()

		location := "seed:" + seedName
		tenants, err := getListOfTenantsForSeed(tc.ctx, tc.seedClient, seed)
		if err != nil {
			tc.resultsCh <- TenantCollectionResult{
				Location: location,
				Error:    fmt.Errorf("seed %s: %w", seedName, err),
			}
			return
		}

		var result []*TenantWithMetadata
		for _, t := range tenants.Items {
			result = append(result, &TenantWithMetadata{
				KubeLBTenant: convertInternalToAPITenant(&t),
				Location:     location,
			})
		}

		tc.resultsCh <- TenantCollectionResult{
			Tenants:  result,
			Location: location,
		}
	}()
}

// CollectFromDatacenter collects tenants from a datacenter
func (tc *TenantCollector) CollectFromDatacenter(seedName, dcName string, seed *v1.Seed, dc v1.Datacenter) {
	tc.wg.Add(1)
	go func() {
		defer tc.wg.Done()

		location := fmt.Sprintf("seed:%s/dc:%s", seedName, dcName)
		tenants, err := getListOfTenantsForDatacenter(tc.ctx, tc.seedClient, seed, dc)
		if err != nil {
			tc.resultsCh <- TenantCollectionResult{
				Location: location,
				Error:    fmt.Errorf("seed %s/dc %s: %w", seedName, dcName, err),
			}
			return
		}

		var result []*TenantWithMetadata
		for _, t := range tenants.Items {
			result = append(result, &TenantWithMetadata{
				KubeLBTenant: convertInternalToAPITenant(&t),
				Location:     location,
			})
		}

		tc.resultsCh <- TenantCollectionResult{
			Tenants:  result,
			Location: location,
		}
	}()
}

// Collect waits for all goroutines to complete and returns the aggregated results
func (tc *TenantCollector) Collect() (map[string]*TenantWithMetadata, []string) {
	// Close the channel once all workers finish
	go func() {
		tc.wg.Wait()
		close(tc.resultsCh)
	}()

	tenantsMap := make(map[string]*TenantWithMetadata)
	var errorsList []string

	// Collect all results
	for result := range tc.resultsCh {
		if result.Error != nil {
			errorsList = append(errorsList, result.Error.Error())
			continue
		}

		for _, tenant := range result.Tenants {
			if existing, exists := tenantsMap[tenant.Name]; exists {
				existing.Location = appendLocationUnique(existing.Location, result.Location)
				if existing.ClusterIDs != nil && tenant.ClusterIDs != nil {
					existing.ClusterIDs = mergeStringSlices(existing.ClusterIDs, tenant.ClusterIDs)
				} else if tenant.ClusterIDs != nil {
					existing.ClusterIDs = tenant.ClusterIDs
				}
			} else {
				tenantsMap[tenant.Name] = tenant
			}
		}
	}

	return tenantsMap, errorsList
}

// Helper function to append location strings uniquely
func appendLocationUnique(existing, new string) string {
	if existing == "" {
		return new
	}
	if strings.Contains(existing, new) {
		return existing
	}
	return existing + ", " + new
}

// ProjectTenantCollector extends TenantCollector for project-specific filtering
type ProjectTenantCollector struct {
	*TenantCollector
	tenantNameToClusters map[string][]string
}

// NewProjectTenantCollector creates a new project tenant collector
func NewProjectTenantCollector(ctx context.Context, seedClient ctrlruntimeclient.Client, tenantNameToClusters map[string][]string) *ProjectTenantCollector {
	return &ProjectTenantCollector{
		TenantCollector:      NewTenantCollector(ctx, seedClient),
		tenantNameToClusters: tenantNameToClusters,
	}
}

// CollectFromSeedForProject collects tenants from a seed filtered by project
func (ptc *ProjectTenantCollector) CollectFromSeedForProject(seedName string, seed *v1.Seed) {
	ptc.wg.Add(1)
	go func() {
		defer ptc.wg.Done()

		location := "seed:" + seedName
		tenants, err := getListOfTenantsForSeed(ptc.ctx, ptc.seedClient, seed)
		if err != nil {
			ptc.resultsCh <- TenantCollectionResult{
				Location: location,
				Error:    fmt.Errorf("seed %s: %w", seedName, err),
			}
			return
		}

		var result []*TenantWithMetadata
		for _, t := range tenants.Items {
			if clusters, belongs := ptc.tenantNameToClusters[t.Name]; belongs {
				result = append(result, &TenantWithMetadata{
					KubeLBTenant: convertInternalToAPITenant(&t),
					Location:     location,
					ClusterIDs:   clusters,
				})
			}
		}

		ptc.resultsCh <- TenantCollectionResult{
			Tenants:  result,
			Location: location,
		}
	}()
}

// CollectFromDatacenterForProject collects tenants from a datacenter filtered by project
func (ptc *ProjectTenantCollector) CollectFromDatacenterForProject(seedName, dcName string, seed *v1.Seed, dc v1.Datacenter) {
	ptc.wg.Add(1)
	go func() {
		defer ptc.wg.Done()

		location := fmt.Sprintf("seed:%s/dc:%s", seedName, dcName)
		tenants, err := getListOfTenantsForDatacenter(ptc.ctx, ptc.seedClient, seed, dc)
		if err != nil {
			ptc.resultsCh <- TenantCollectionResult{
				Location: location,
				Error:    fmt.Errorf("seed %s/dc %s: %w", seedName, dcName, err),
			}
			return
		}

		var result []*TenantWithMetadata
		for _, t := range tenants.Items {
			if clusters, belongs := ptc.tenantNameToClusters[t.Name]; belongs {
				result = append(result, &TenantWithMetadata{
					KubeLBTenant: convertInternalToAPITenant(&t),
					Location:     location,
					ClusterIDs:   clusters,
				})
			}
		}

		ptc.resultsCh <- TenantCollectionResult{
			Tenants:  result,
			Location: location,
		}
	}()
}

// aggregateTenantsForSeed collects tenants for a specific seed
func aggregateTenantsForSeed(ctx context.Context, seedClient ctrlruntimeclient.Client, seed *v1.Seed) (map[string]*TenantWithMetadata, []string) {
	collector := NewTenantCollector(ctx, seedClient)

	// Launch collection from seed
	if seed.Spec.KubeLB != nil && seed.Spec.KubeLB.Kubeconfig.Name != "" {
		collector.CollectFromSeed(seed.Name, seed)
	}

	// Launch collection from datacenters
	for dcName, dc := range seed.Spec.Datacenters {
		if dc.Spec.KubeLB != nil && dc.Spec.KubeLB.Kubeconfig.Name != "" {
			collector.CollectFromDatacenter(seed.Name, dcName, seed, dc)
		}
	}

	return collector.Collect()
}

// ListAllKubeLBTenants returns all KubeLB tenants across all seeds/datacenters for admin panel
func ListAllKubeLBTenants(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) (interface{}, error) {
	req, ok := request.(listAllKubeLBTenantsReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	if err := req.Validate(); err != nil {
		return nil, utilerrors.NewBadRequest(err.Error())
	}

	// Verify admin access
	userInfo, err := userInfoGetter(ctx, "")
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	if !userInfo.IsAdmin {
		return nil, utilerrors.New(403, "forbidden: admin access required")
	}

	seeds, err := seedsGetter()
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	// Check if the seed exists
	seed, exists := seeds[req.SeedName]
	if !exists {
		return nil, utilerrors.NewNotFound("seed", req.SeedName)
	}

	privilegedClusterProvider := ctx.Value(middleware.PrivilegedClusterProviderContextKey).(provider.PrivilegedClusterProvider)
	seedClient := privilegedClusterProvider.GetSeedClusterAdminRuntimeClient()

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

	// Create a context with timeout to prevent hanging on slow operations
	// ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	// defer cancel()

	// Collect tenants concurrently using the helper.
	tenantsMap, errorsList := aggregateTenantsForSeed(ctx, seedClient, seed)

	tenants := make([]*TenantWithMetadata, 0, len(tenantsMap))
	matchingCount := 0

	for _, t := range tenantsMap {
		// Check if tenant name matches any cluster ID (default view)
		if !req.ShowAll {
			// Only show tenants that match cluster IDs
			if _, exists := clusterIDs[t.Name]; exists {
				tenants = append(tenants, t)
				matchingCount++
			}
		} else {
			// Show all tenants
			tenants = append(tenants, t)
			if _, exists := clusterIDs[t.Name]; exists {
				matchingCount++
			}
		}
	}

	// Sort tenants by name for consistent responses
	sort.Slice(tenants, func(i, j int) bool {
		return tenants[i].Name < tenants[j].Name
	})

	return &ListAllTenantsResponse{
		Tenants:       tenants,
		Errors:        errorsList,
		TotalCount:    len(tenantsMap),
		MatchingCount: matchingCount,
		ShowAll:       req.ShowAll,
	}, nil
}

// Helper function to get project clusters with tenant information
func getProjectClusters(ctx context.Context, project *v1.Project, userInfo *provider.UserInfo, seeds map[string]*v1.Seed, clusterProviderGetter provider.ClusterProviderGetter) (map[string]*v1.Cluster, error) {
	clusters := make(map[string]*v1.Cluster)

	for _, seed := range seeds {
		clusterProvider, err := clusterProviderGetter(seed)
		if err != nil {
			continue // Skip this seed if we can't get a provider
		}

		clusterList, err := clusterProvider.List(ctx, project, &provider.ClusterListOptions{})
		if err != nil {
			continue // Skip this seed if we can't list clusters
		}

		for i := range clusterList.Items {
			cluster := clusterList.Items[i]
			clusters[cluster.Name] = &cluster
		}
	}

	return clusters, nil
}

// Helper function to get all clusters across all projects for admin view
func getAllClusters(ctx context.Context, seeds map[string]*v1.Seed, clusterProviderGetter provider.ClusterProviderGetter) (map[string]*v1.Cluster, error) {
	clusters := make(map[string]*v1.Cluster)

	for _, seed := range seeds {
		_, err := clusterProviderGetter(seed)
		if err != nil {
			continue // Skip this seed if we can't get a provider
		}

		// For admin view, we need to get clusters from all projects
		// We can use the privileged provider to list all clusters
		// Note: This requires adjusting the interface to support listing all clusters
		// For now, we'll skip this and rely on tenant-cluster label matching
	}

	return clusters, nil
}

// ListProjectKubeLBTenants returns KubeLB tenants for a specific project
func ListProjectKubeLBTenants(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, clusterProviderGetter provider.ClusterProviderGetter) (interface{}, error) {
	req, ok := request.(listProjectKubeLBTenantsReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	if err := req.Validate(); err != nil {
		return nil, utilerrors.NewBadRequest(err.Error())
	}

	userInfo, err := userInfoGetter(ctx, req.ProjectID)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	project, err := common.GetProject(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, nil)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	seeds, err := seedsGetter()
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	// Check if the seed exists
	seed, exists := seeds[req.SeedName]
	if !exists {
		return nil, utilerrors.NewNotFound("seed", req.SeedName)
	}

	projectClusters, err := getProjectClusters(ctx, project, userInfo, map[string]*v1.Seed{req.SeedName: seed}, clusterProviderGetter)
	if err != nil {
		// If we can't get project clusters, continue with empty map
		projectClusters = make(map[string]*v1.Cluster)
	}

	privilegedClusterProvider := ctx.Value(middleware.PrivilegedClusterProviderContextKey).(provider.PrivilegedClusterProvider)
	seedClient := privilegedClusterProvider.GetSeedClusterAdminRuntimeClient()

	// Create a context with timeout to prevent hanging on slow operations
	// ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	// defer cancel()

	// Prepare mapping from tenant name to clusters in project
	tenantNameToClusters := make(map[string][]string)
	projectClusterNames := make(map[string]bool)
	for clusterName, cluster := range projectClusters {
		projectClusterNames[clusterName] = true
		if tenantName, ok := cluster.Labels["kubelb.k8c.io/tenant"]; ok && tenantName != "" {
			tenantNameToClusters[tenantName] = append(tenantNameToClusters[tenantName], clusterName)
		} else {
			// If no explicit tenant label, assume tenant name matches cluster name
			tenantNameToClusters[clusterName] = append(tenantNameToClusters[clusterName], clusterName)
		}
	}

	// Collect all tenants first
	allTenantsMap, errorsList := aggregateTenantsForSeed(ctx, seedClient, seed)

	// Filter tenants based on project association
	tenants := make([]*TenantWithMetadata, 0)
	matchingCount := 0
	totalProjectTenants := 0

	for tenantName, tenant := range allTenantsMap {
		// Check if this tenant is associated with the project
		if clusters, hasAssociation := tenantNameToClusters[tenantName]; hasAssociation {
			totalProjectTenants++
			tenant.ClusterIDs = clusters

			// Apply filtering based on showAll parameter
			if !req.ShowAll {
				// Only show tenants that match cluster IDs
				if _, isClusterName := projectClusterNames[tenantName]; isClusterName {
					tenants = append(tenants, tenant)
					matchingCount++
				}
			} else {
				// Show all project-associated tenants
				tenants = append(tenants, tenant)
				if _, isClusterName := projectClusterNames[tenantName]; isClusterName {
					matchingCount++
				}
			}
		}
	}

	// Sort tenants by name for consistent responses
	sort.Slice(tenants, func(i, j int) bool {
		return tenants[i].Name < tenants[j].Name
	})

	return &ListProjectTenantsResponse{
		Tenants:       tenants,
		Errors:        errorsList,
		TotalCount:    totalProjectTenants,
		MatchingCount: matchingCount,
		ShowAll:       req.ShowAll,
	}, nil
}

// PatchDashboardKubeLBTenant patches a KubeLB tenant from the dashboard
func PatchDashboardKubeLBTenant(ctx context.Context, request interface{}, userInfoGetter provider.UserInfoGetter, seedsGetter provider.SeedsGetter) (interface{}, error) {
	req, ok := request.(patchDashboardKubeLBTenantReq)
	if !ok {
		return nil, utilerrors.NewBadRequest("invalid request")
	}

	// TODO: Implement tenant patching logic
	// This would need to find the tenant across all seeds/datacenters and patch it
	// For now, return a placeholder
	_ = req.TenantName
	_ = req.Body

	return nil, fmt.Errorf("not implemented")
}

// DecodePatchDashboardKubeLBTenantReq decodes patch dashboard tenant request
func DecodePatchDashboardKubeLBTenantReq(c context.Context, r *http.Request) (interface{}, error) {
	var req patchDashboardKubeLBTenantReq
	tenantName := mux.Vars(r)["tenant_name"]
	if tenantName == "" {
		return nil, utilerrors.NewBadRequest("'tenant_name' parameter is required but was not provided")
	}
	req.TenantName = tenantName

	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}
	return req, nil
}

// DecodeListAllKubeLBTenantsReq decodes the request for listing all tenants
func DecodeListAllKubeLBTenantsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req listAllKubeLBTenantsReq

	seedName := mux.Vars(r)["seed_name"]
	if seedName == "" {
		return nil, utilerrors.NewBadRequest("'seed_name' parameter is required but was not provided")
	}
	req.SeedName = seedName

	showAll := r.URL.Query().Get("show_all")
	if strings.EqualFold(showAll, "true") {
		req.ShowAll = true
	}
	return req, nil
}

// DecodeListProjectKubeLBTenantsReq decodes the request for listing project tenants
func DecodeListProjectKubeLBTenantsReq(c context.Context, r *http.Request) (interface{}, error) {
	var req listProjectKubeLBTenantsReq
	projectID := mux.Vars(r)["project_id"]
	if projectID == "" {
		return nil, utilerrors.NewBadRequest("'project_id' parameter is required but was not provided")
	}
	req.ProjectID = projectID

	seedName := mux.Vars(r)["seed_name"]
	if seedName == "" {
		return nil, utilerrors.NewBadRequest("'seed_name' parameter is required but was not provided")
	}
	req.SeedName = seedName

	showAll := r.URL.Query().Get("show_all")
	if strings.EqualFold(showAll, "true") {
		req.ShowAll = true
	}
	return req, nil
}

