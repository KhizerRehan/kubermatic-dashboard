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

package v2_test

import (
	"testing"

	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	"k8s.io/apimachinery/pkg/api/resource"
)

func TestConvertToAPIQuota(t *testing.T) {
	t.Parallel()

	int64Ptr := func(v int64) *int64 { return &v }
	float64Ptr := func(v float64) *float64 { return &v }
	mustQty := func(s string) *resource.Quantity {
		q := resource.MustParse(s)
		return &q
	}

	testCases := []struct {
		name     string
		encoding string
		in       kubermaticv1.ResourceDetails
		want     apiv2.Quota
	}{
		// Legacy PR-7729 branch: decimal SI suffix re-interpreted as binary IEC,
		// then divided by 2^30. Behavior preserved for backward compatibility
		// with kubermatic/dashboard#7715 customers.
		{
			name:     "legacy: 6500M reads as 6500Mi divided by GiB",
			encoding: "",
			in: kubermaticv1.ResourceDetails{
				CPU:     mustQty("4"),
				Memory:  mustQty("6500M"),
				Storage: mustQty("60500M"),
			},
			want: apiv2.Quota{
				CPU:     int64Ptr(4),
				Memory:  float64Ptr(6.35),
				Storage: float64Ptr(59.08),
			},
		},
		{
			name:     "legacy: 6G reads as 6Gi divided by GiB",
			encoding: "",
			in: kubermaticv1.ResourceDetails{
				Memory:  mustQty("6G"),
				Storage: mustQty("100G"),
			},
			want: apiv2.Quota{
				Memory:  float64Ptr(6),
				Storage: float64Ptr(100),
			},
		},
		{
			name:     "legacy: 6Gi reads as 6 GiB",
			encoding: "",
			in: kubermaticv1.ResourceDetails{
				Memory:  mustQty("6Gi"),
				Storage: mustQty("125Gi"),
			},
			want: apiv2.Quota{
				Memory:  float64Ptr(6),
				Storage: float64Ptr(125),
			},
		},
		// EncodingDecimal branch: honest decimal SI math.
		{
			name:     "decimal: 6500M = 6.5 GB",
			encoding: apiv2.EncodingDecimal,
			in: kubermaticv1.ResourceDetails{
				CPU:     mustQty("4"),
				Memory:  mustQty("6500M"),
				Storage: mustQty("60500M"),
			},
			want: apiv2.Quota{
				CPU:     int64Ptr(4),
				Memory:  float64Ptr(6.5),
				Storage: float64Ptr(60.5),
			},
		},
		{
			name:     "decimal: 6G = 6 GB, 100G = 100 GB",
			encoding: apiv2.EncodingDecimal,
			in: kubermaticv1.ResourceDetails{
				Memory:  mustQty("6G"),
				Storage: mustQty("100G"),
			},
			want: apiv2.Quota{
				Memory:  float64Ptr(6),
				Storage: float64Ptr(100),
			},
		},
		{
			name:     "decimal: 6Gi converts to its decimal GB equivalent",
			encoding: apiv2.EncodingDecimal,
			in: kubermaticv1.ResourceDetails{
				Memory:  mustQty("6Gi"),
				Storage: mustQty("125Gi"),
			},
			want: apiv2.Quota{
				Memory:  float64Ptr(6.44),
				Storage: float64Ptr(134.22),
			},
		},
		{
			name:     "decimal: 1235Mi rounds to 1.29 GB",
			encoding: apiv2.EncodingDecimal,
			in: kubermaticv1.ResourceDetails{
				Memory: mustQty("1235Mi"),
			},
			want: apiv2.Quota{
				Memory: float64Ptr(1.29),
			},
		},
		// Edge cases.
		{
			name:     "zero memory and storage are omitted in legacy mode",
			encoding: "",
			in: kubermaticv1.ResourceDetails{
				CPU:     mustQty("2"),
				Memory:  mustQty("0"),
				Storage: mustQty("0"),
			},
			want: apiv2.Quota{
				CPU: int64Ptr(2),
			},
		},
		{
			name:     "zero memory and storage are omitted in decimal mode",
			encoding: apiv2.EncodingDecimal,
			in: kubermaticv1.ResourceDetails{
				CPU:     mustQty("2"),
				Memory:  mustQty("0"),
				Storage: mustQty("0"),
			},
			want: apiv2.Quota{
				CPU: int64Ptr(2),
			},
		},
		{
			name:     "nil fields stay nil regardless of encoding",
			encoding: apiv2.EncodingDecimal,
			in:       kubermaticv1.ResourceDetails{},
			want:     apiv2.Quota{},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got := apiv2.ConvertToAPIQuota(tc.in, tc.encoding)

			if !int64PtrEqual(got.CPU, tc.want.CPU) {
				t.Errorf("CPU: got %v, want %v", deref64(got.CPU), deref64(tc.want.CPU))
			}
			if !float64PtrEqual(got.Memory, tc.want.Memory) {
				t.Errorf("Memory: got %v, want %v", derefF(got.Memory), derefF(tc.want.Memory))
			}
			if !float64PtrEqual(got.Storage, tc.want.Storage) {
				t.Errorf("Storage: got %v, want %v", derefF(got.Storage), derefF(tc.want.Storage))
			}
		})
	}
}

func int64PtrEqual(a, b *int64) bool {
	if a == nil || b == nil {
		return a == b
	}
	return *a == *b
}

func float64PtrEqual(a, b *float64) bool {
	if a == nil || b == nil {
		return a == b
	}
	return *a == *b
}

func deref64(p *int64) any {
	if p == nil {
		return nil
	}
	return *p
}

func derefF(p *float64) any {
	if p == nil {
		return nil
	}
	return *p
}
