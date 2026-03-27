/*
Copyright 2025 The Kubermatic Kubernetes Platform contributors.

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

package validation

import (
	"reflect"
	"strings"

	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

// ValidateRequiredFields checks that all struct fields tagged with `required:"true"`
// are non-zero. It accepts a pointer to the struct to validate.
func ValidateRequiredFields(structPtr any) error {
	fields := reflect.ValueOf(structPtr).Elem()
	for i := 0; i < fields.NumField(); i++ {
		requiredTag := fields.Type().Field(i).Tag.Get("required")
		if strings.Contains(requiredTag, "true") && fields.Field(i).IsZero() {
			return utilerrors.NewBadRequest("required field is missing: %v", fields.Type().Field(i).Name)
		}
	}
	return nil
}
