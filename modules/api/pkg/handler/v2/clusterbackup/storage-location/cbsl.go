/*
Copyright 2024 The Kubermatic Kubernetes Platform contributors.

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

package storagelocation

import (
	"context"

	"github.com/go-kit/kit/endpoint"

	"k8c.io/dashboard/v2/pkg/provider"
)

func ListCBSLEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		return listCBSL(ctx, req, userInfoGetter, provider, projectProvider)
	}
}

func GetCBSLEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		return getCBSL(ctx, req, userInfoGetter, provider, projectProvider)
	}
}

func ListCBSLBucketObjectsEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		return listCBSLBucketObjects(ctx, req, userInfoGetter, provider, projectProvider)
	}
}

func GetCBSLCredentialsEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		return getCBSLCredentials(ctx, req, userInfoGetter, provider, projectProvider)
	}
}

func CreateCBSLEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider, settingsProvider provider.SettingsProvider) endpoint.Endpoint {
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		return createCBSL(ctx, req, userInfoGetter, provider, projectProvider, settingsProvider)
	}
}

func DeleteCBSLEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		return nil, deleteCBSL(ctx, req, userInfoGetter, provider, projectProvider)
	}
}

func PatchCBSLEndpoint(userInfoGetter provider.UserInfoGetter, provider provider.BackupStorageProvider, projectProvider provider.ProjectProvider) endpoint.Endpoint {
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		return patchCBSL(ctx, req, userInfoGetter, provider, projectProvider)
	}
}
