/*
Copyright 2020 The Kubermatic Kubernetes Platform contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package ssh

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-kit/kit/endpoint"
	"github.com/gorilla/mux"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/features"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

const DisableUserSSHKey = "DisableUserSSHKey"

func CreateEndpoint(keyProvider provider.SSHKeyProvider, privilegedSSHKeyProvider provider.PrivilegedSSHKeyProvider, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, userInfoGetter provider.UserInfoGetter, features features.FeatureGate) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		if features.Enabled(DisableUserSSHKey) {
			return nil, fmt.Errorf("User SSH keys feature is disabled")
		}
		req, ok := request.(CreateReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		project, err := common.GetProject(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, nil)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		existingKeys, err := keyProvider.List(ctx, project, &provider.SSHKeyListOptions{SSHKeyName: req.Key.Name})
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		if len(existingKeys) > 0 {
			return nil, utilerrors.NewAlreadyExists("ssh key", req.Key.Name)
		}

		key, err := createUserSSHKey(ctx, userInfoGetter, keyProvider, privilegedSSHKeyProvider, project, req.Key.Name, req.Key.Spec.PublicKey)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		apiKey := apiv1.SSHKey{
			ObjectMeta: apiv1.ObjectMeta{
				ID:                key.Name,
				Name:              key.Spec.Name,
				CreationTimestamp: apiv1.NewTime(key.CreationTimestamp.Time),
			},
			Spec: apiv1.SSHKeySpec{
				Fingerprint: key.Spec.Fingerprint,
				PublicKey:   key.Spec.PublicKey,
			},
		}
		return apiKey, nil
	}
}

func createUserSSHKey(ctx context.Context, userInfoGetter provider.UserInfoGetter, keyProvider provider.SSHKeyProvider, privilegedSSHKeyProvider provider.PrivilegedSSHKeyProvider, project *kubermaticv1.Project, keyName, pubKey string) (*kubermaticv1.UserSSHKey, error) {
	adminUserInfo, err := userInfoGetter(ctx, "")
	if err != nil {
		return nil, err
	}
	if adminUserInfo.IsAdmin {
		return privilegedSSHKeyProvider.CreateUnsecured(ctx, project, keyName, pubKey)
	}
	userInfo, err := userInfoGetter(ctx, project.Name)
	if err != nil {
		return nil, err
	}
	return keyProvider.Create(ctx, userInfo, project, keyName, pubKey)
}

func DeleteEndpoint(keyProvider provider.SSHKeyProvider, privilegedSSHKeyProvider provider.PrivilegedSSHKeyProvider, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, userInfoGetter provider.UserInfoGetter, features features.FeatureGate) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		if features.Enabled(DisableUserSSHKey) {
			return nil, fmt.Errorf("SSH keys feature is disabled")
		}
		req, ok := request.(DeleteReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		project, err := common.GetProject(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, nil)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		if err := deleteUserSSHKey(ctx, userInfoGetter, keyProvider, privilegedSSHKeyProvider, project, req.SSHKeyID); err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		return nil, nil
	}
}

func deleteUserSSHKey(ctx context.Context, userInfoGetter provider.UserInfoGetter, keyProvider provider.SSHKeyProvider, privilegedSSHKeyProvider provider.PrivilegedSSHKeyProvider, project *kubermaticv1.Project, keyName string) error {
	adminUserInfo, err := userInfoGetter(ctx, "")
	if err != nil {
		return err
	}
	if adminUserInfo.IsAdmin {
		return privilegedSSHKeyProvider.DeleteUnsecured(ctx, keyName)
	}
	userInfo, err := userInfoGetter(ctx, project.Name)
	if err != nil {
		return err
	}
	return keyProvider.Delete(ctx, userInfo, keyName)
}

func ListEndpoint(keyProvider provider.SSHKeyProvider, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, userInfoGetter provider.UserInfoGetter, features features.FeatureGate) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		if features.Enabled(DisableUserSSHKey) {
			return nil, fmt.Errorf("SSH keys feature is disabled")
		}
		req, ok := request.(ListReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		if len(req.ProjectID) == 0 {
			return nil, utilerrors.NewBadRequest("the name of the project to delete cannot be empty")
		}

		project, err := common.GetProject(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, nil)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		keys, err := keyProvider.List(ctx, project, nil)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		apiKeys := common.ConvertInternalSSHKeysToExternal(keys)
		return apiKeys, nil
	}
}

// ListReq defined HTTP request for listSHHKeys endpoint
// swagger:parameters listSSHKeys
type ListReq struct {
	common.ProjectReq
}

func DecodeListReq(c context.Context, r *http.Request) (interface{}, error) {
	req, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, nil
	}
	return ListReq{ProjectReq: req.(common.ProjectReq)}, err
}

// DeleteReq defines HTTP request for deleteSSHKey endpoint
// swagger:parameters deleteSSHKey
type DeleteReq struct {
	common.ProjectReq
	// in: path
	SSHKeyID string `json:"key_id"`
}

func DecodeDeleteReq(c context.Context, r *http.Request) (interface{}, error) {
	var req DeleteReq

	dcr, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}

	req.ProjectReq = dcr.(common.ProjectReq)
	SSHKeyID, ok := mux.Vars(r)["key_id"]
	if !ok {
		return nil, fmt.Errorf("'key_id' parameter is required in order to delete ssh key")
	}

	req.SSHKeyID = SSHKeyID
	return req, nil
}

// CreateReq represent a request for specific data to create a new SSH key
// swagger:parameters createSSHKey
type CreateReq struct {
	common.ProjectReq
	// in: body
	Key apiv1.SSHKey
}

func DecodeCreateReq(c context.Context, r *http.Request) (interface{}, error) {
	var req CreateReq

	dcr, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}
	req.ProjectReq = dcr.(common.ProjectReq)

	req.Key = apiv1.SSHKey{}
	if err := json.NewDecoder(r.Body).Decode(&req.Key); err != nil {
		return nil, utilerrors.NewBadRequest("unable to parse the input: %v", err)
	}

	if len(req.Key.Name) == 0 {
		return nil, fmt.Errorf("'name' field cannot be empty")
	}
	if len(req.Key.Spec.PublicKey) == 0 {
		return nil, fmt.Errorf("'spec.publicKey' field cannot be empty")
	}

	return req, nil
}
