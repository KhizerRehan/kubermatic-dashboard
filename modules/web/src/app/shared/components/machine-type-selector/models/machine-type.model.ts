// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Supported cloud provider types for machine type normalization
 */
export enum ProviderType {
  AWS = 'aws',
  GCP = 'gcp',
  Azure = 'azure',
  Hetzner = 'hetzner',
  DigitalOcean = 'digitalocean',
  OpenStack = 'openstack',
  KubeVirt = 'kubevirt',
  Alibaba = 'alibaba',
  Anexia = 'anexia',
  VSphere = 'vsphere',
  Nutanix = 'nutanix',
  VMwareCloudDirector = 'vmwareclouddirector',
  Default = 'default',
}

/**
 * Machine type category based on compute capabilities
 */
export enum MachineCategory {
  CPU = 'cpu',
  GPU = 'gpu',
}

/**
 * Normalized machine type interface - provider-agnostic representation
 * All provider-specific data is transformed to this common format
 */
export interface NormalizedMachineType {
  /** Unique identifier (original name/slug from provider) */
  id: string;

  /** Human-readable display name */
  name: string;

  /** Number of virtual CPUs */
  vcpus: number;

  /** Memory in GB (normalized from MB/bytes if needed) */
  memoryGB: number;

  /** Number of GPUs (0 for non-GPU instances) */
  gpus: number;

  /** Machine category based on GPU availability */
  category: MachineCategory;

  /** Optional description or type information */
  description?: string;

  /** CPU architecture (e.g., x64, arm64) */
  architecture?: string;

  /** Hourly price in USD */
  pricePerHour?: number;

  /** Disk size in GB */
  diskGB?: number;

  /** Storage for provider-specific additional data */
  additionalInfo?: Record<string, unknown>;
}

/**
 * Configuration for machine type table columns
 */
export interface MachineTypeColumnConfig {
  /** Column identifier */
  key: string;

  /** Display label for the column header */
  label: string;

  /** Whether this column should be visible */
  visible: boolean;

  /** Optional formatter function for display */
  formatter?: (value: unknown) => string;

  /** Column width (CSS value) */
  width?: string;

  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * Default column configuration for the machine type table
 */
export const DEFAULT_COLUMN_CONFIG: MachineTypeColumnConfig[] = [
  {key: 'select', label: '', visible: true, width: '48px', align: 'center'},
  {key: 'name', label: 'Name', visible: true, align: 'left'},
  {key: 'vcpus', label: 'vCPU', visible: true, width: '80px', align: 'center'},
  {key: 'memoryGB', label: 'Memory', visible: true, width: '100px', align: 'center'},
  {key: 'gpus', label: 'GPUs', visible: false, width: '80px', align: 'center'},
  {key: 'description', label: 'Type', visible: true, align: 'left'},
  {key: 'pricePerHour', label: 'Price ($/hr)', visible: false, width: '120px', align: 'right'},
];
