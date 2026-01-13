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

import {ProviderType} from '../models/machine-type.model';
import {AWSMachineTypeAdapter} from './aws.adapter';
import {AzureMachineTypeAdapter} from './azure.adapter';
import {MachineTypeAdapter} from './base.adapter';
import {DefaultMachineTypeAdapter} from './default.adapter';
import {DigitalOceanMachineTypeAdapter} from './digitalocean.adapter';
import {GCPMachineTypeAdapter} from './gcp.adapter';
import {HetznerMachineTypeAdapter} from './hetzner.adapter';
import {OpenStackMachineTypeAdapter} from './openstack.adapter';

// Re-export all adapters and base class
export {MachineTypeAdapter} from './base.adapter';
export {AWSMachineTypeAdapter, AWSMachineType} from './aws.adapter';
export {GCPMachineTypeAdapter, GCPMachineType} from './gcp.adapter';
export {AzureMachineTypeAdapter, AzureMachineType} from './azure.adapter';
export {HetznerMachineTypeAdapter, HetznerMachineType, HetznerGroupedResponse} from './hetzner.adapter';
export {DigitalOceanMachineTypeAdapter, DigitalOceanMachineType, DigitalOceanGroupedResponse} from './digitalocean.adapter';
export {OpenStackMachineTypeAdapter, OpenStackMachineType} from './openstack.adapter';
export {DefaultMachineTypeAdapter, GenericMachineType} from './default.adapter';

/**
 * Registry of all available machine type adapters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapterRegistry = new Map<ProviderType, MachineTypeAdapter<any>>();
adapterRegistry.set(ProviderType.AWS, new AWSMachineTypeAdapter());
adapterRegistry.set(ProviderType.GCP, new GCPMachineTypeAdapter());
adapterRegistry.set(ProviderType.Azure, new AzureMachineTypeAdapter());
adapterRegistry.set(ProviderType.Hetzner, new HetznerMachineTypeAdapter());
adapterRegistry.set(ProviderType.DigitalOcean, new DigitalOceanMachineTypeAdapter());
adapterRegistry.set(ProviderType.OpenStack, new OpenStackMachineTypeAdapter());
adapterRegistry.set(ProviderType.Default, new DefaultMachineTypeAdapter());

/**
 * Factory class for creating and retrieving machine type adapters
 * Uses the Factory pattern to provide the appropriate adapter based on provider type
 */
export class MachineTypeAdapterFactory {
  private static defaultAdapter = new DefaultMachineTypeAdapter();

  /**
   * Get an adapter for the specified provider type
   * @param provider - The provider type or string identifier
   * @returns The appropriate adapter for the provider, or default adapter if not found
   */
  static getAdapter(provider: ProviderType | string): MachineTypeAdapter {
    // Try to match string to enum
    if (typeof provider === 'string') {
      const normalizedProvider = provider.toLowerCase();

      // Check for exact match in enum values
      for (const [, value] of Object.entries(ProviderType)) {
        if (value === normalizedProvider) {
          return adapterRegistry.get(value as ProviderType) ?? this.defaultAdapter;
        }
      }

      // Check for partial matches for common provider names
      if (normalizedProvider.includes('aws') || normalizedProvider.includes('amazon')) {
        return adapterRegistry.get(ProviderType.AWS)!;
      }
      if (normalizedProvider.includes('gcp') || normalizedProvider.includes('google')) {
        return adapterRegistry.get(ProviderType.GCP)!;
      }
      if (normalizedProvider.includes('azure') || normalizedProvider.includes('microsoft')) {
        return adapterRegistry.get(ProviderType.Azure)!;
      }
      if (normalizedProvider.includes('hetzner')) {
        return adapterRegistry.get(ProviderType.Hetzner)!;
      }
      if (normalizedProvider.includes('digitalocean') || normalizedProvider.includes('do')) {
        return adapterRegistry.get(ProviderType.DigitalOcean)!;
      }
      if (normalizedProvider.includes('openstack')) {
        return adapterRegistry.get(ProviderType.OpenStack)!;
      }
    }

    // Direct enum lookup
    if (adapterRegistry.has(provider as ProviderType)) {
      return adapterRegistry.get(provider as ProviderType)!;
    }

    return this.defaultAdapter;
  }

  /**
   * Register a custom adapter for a provider type
   * @param provider - The provider type
   * @param adapter - The adapter instance to register
   */
  static registerAdapter(provider: ProviderType, adapter: MachineTypeAdapter): void {
    adapterRegistry.set(provider, adapter);
  }

  /**
   * Check if an adapter exists for the given provider
   * @param provider - The provider type to check
   * @returns True if a specific adapter exists (not default)
   */
  static hasAdapter(provider: ProviderType | string): boolean {
    if (typeof provider === 'string') {
      const normalizedProvider = provider.toLowerCase();
      for (const value of Object.values(ProviderType)) {
        if (value === normalizedProvider && adapterRegistry.has(value as ProviderType)) {
          return true;
        }
      }
      return false;
    }
    return adapterRegistry.has(provider) && provider !== ProviderType.Default;
  }

  /**
   * Get all registered provider types
   */
  static getRegisteredProviders(): ProviderType[] {
    return Array.from(adapterRegistry.keys());
  }
}
