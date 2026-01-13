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

import {MachineCategory, NormalizedMachineType, ProviderType} from '../models/machine-type.model';

/**
 * Abstract base class for machine type adapters
 * Implements the Strategy pattern for provider-specific data normalization
 */
export abstract class MachineTypeAdapter<T = unknown> {
  /** The provider type this adapter handles */
  abstract readonly providerType: ProviderType;

  /**
   * Normalize a single machine type from provider-specific format
   * @param raw - Raw machine type data from provider API
   * @returns Normalized machine type
   */
  abstract normalize(raw: T): NormalizedMachineType;

  /**
   * Normalize an array of machine types
   * @param rawData - Array of raw machine type data or nested structure
   * @returns Array of normalized machine types
   */
  abstract normalizeAll(rawData: T[] | Record<string, T[]>): NormalizedMachineType[];

  /**
   * Determine if a machine type is GPU-enabled
   * Can be overridden by specific adapters for provider-specific logic
   */
  protected isGpuType(raw: T): boolean {
    const normalized = this.normalize(raw);
    return normalized.gpus > 0;
  }

  /**
   * Categorize machine type based on GPU availability
   */
  protected categorize(gpus: number): MachineCategory {
    return gpus > 0 ? MachineCategory.GPU : MachineCategory.CPU;
  }

  /**
   * Convert memory from MB to GB
   */
  protected mbToGb(memoryMB: number): number {
    return Math.round((memoryMB / 1024) * 100) / 100;
  }

  /**
   * Infer machine type description from name if not provided
   */
  protected inferDescription(name: string, gpus: number): string {
    const lowerName = name.toLowerCase();

    if (gpus > 0 || lowerName.includes('gpu')) {
      return 'GPU Optimized';
    }
    if (lowerName.includes('compute') || lowerName.includes('highcpu') || lowerName.includes('high-cpu')) {
      return 'Compute Optimized';
    }
    if (lowerName.includes('memory') || lowerName.includes('highmem') || lowerName.includes('high-memory')) {
      return 'Memory Optimized';
    }
    if (lowerName.includes('storage') || lowerName.includes('disk')) {
      return 'Storage Optimized';
    }
    return 'General Purpose';
  }
}
