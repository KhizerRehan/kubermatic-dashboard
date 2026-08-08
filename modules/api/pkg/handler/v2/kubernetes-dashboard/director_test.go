/*
Copyright 2026 The Kubermatic Kubernetes Platform contributors.

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

package kubernetesdashboard

import (
	"testing"
)

func TestGetBasePath(t *testing.T) {
	director := &dashboardProxyDirector{}
	tests := []struct {
		name     string
		path     string
		expected string
	}{
		{
			name:     "strips KKP prefix before proxy",
			path:     "/api/v2/projects/abc/clusters/xyz/dashboard/proxy/namespaces",
			expected: "/namespaces",
		},
		{
			name:     "root proxy path returns slash",
			path:     "/api/v2/projects/abc/clusters/xyz/dashboard/proxy/",
			expected: "/",
		},
		{
			name:     "path without proxy returns slash",
			path:     "/api/v2/projects/abc/clusters/xyz",
			expected: "/",
		},
		{
			name:     "headlamp deep path preserved",
			path:     "/api/v2/projects/abc/clusters/xyz/dashboard/proxy/c/local/namespaces/default/pods",
			expected: "/c/local/namespaces/default/pods",
		},
		{
			name:     "proxy in project ID does not confuse path stripping",
			path:     "/api/v2/projects/myproxy-project/clusters/xyz/dashboard/proxy/namespaces",
			expected: "/namespaces",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := director.getBasePath(tt.path)
			if result != tt.expected {
				t.Errorf("getBasePath(%q) = %q, want %q", tt.path, result, tt.expected)
			}
		})
	}
}
