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

import {NormalizedMachineType, ProviderType} from '../models/machine-type.model';
import {MachineTypeAdapter} from './base.adapter';

/**
 * GCP machine type format from API
 * Note: Memory is in MB, GPU info is typically in the name/description
 */
export interface GCPMachineType {
  name: string;
  description?: string;
  memory: number; // in MB
  vcpus: number;
}

/**
 * Adapter for GCP Compute Engine machine types
 * Handles memory conversion from MB to GB and GPU inference from name
 */
export class GCPMachineTypeAdapter extends MachineTypeAdapter<GCPMachineType> {
  readonly providerType = ProviderType.GCP;

  normalize(raw: GCPMachineType): NormalizedMachineType {
    const gpus = this.extractGpuCount(raw);
    const memoryGB = this.mbToGb(raw.memory);

    return {
      id: raw.name,
      name: raw.name,
      vcpus: raw.vcpus,
      memoryGB,
      gpus,
      category: this.categorize(gpus),
      description: raw.description || this.inferGcpDescription(raw.name, gpus),
    };
  }

  normalizeAll(rawData: GCPMachineType[]): NormalizedMachineType[] {
    if (!Array.isArray(rawData)) {
      return [];
    }
    return rawData.map(item => this.normalize(item));
  }

  /**
   * Extract GPU count from GCP machine type
   * GCP uses naming conventions to indicate GPU-optimized instances
   */
  private extractGpuCount(raw: GCPMachineType): number {
    const name = raw.name.toLowerCase();
    const description = (raw.description || '').toLowerCase();

    // Check for explicit GPU mentions in description
    const gpuMatch = description.match(/(\d+)\s*(nvidia|gpu)/i);
    if (gpuMatch) {
      return parseInt(gpuMatch[1], 10);
    }

    // A2/A3 are accelerator-optimized (GPU) instances
    if (name.startsWith('a2-') || name.startsWith('a3-')) {
      // Extract GPU count from name pattern (e.g., a2-highgpu-8g = 8 GPUs)
      const match = name.match(/-(\d+)g$/);
      if (match) {
        return parseInt(match[1], 10);
      }
      return 1; // Default to 1 GPU for A2/A3 instances
    }

    // G2 instances also have GPUs
    if (name.startsWith('g2-')) {
      return 1;
    }

    return 0;
  }

  /**
   * Infer GCP-specific description from machine type name
   */
  private inferGcpDescription(name: string, gpus: number): string {
    const lowerName = name.toLowerCase();

    if (gpus > 0 || lowerName.startsWith('a2-') || lowerName.startsWith('a3-') || lowerName.startsWith('g2-')) {
      return 'Accelerator Optimized';
    }
    if (lowerName.includes('highcpu')) {
      return 'Compute Optimized';
    }
    if (lowerName.includes('highmem')) {
      return 'Memory Optimized';
    }
    if (lowerName.startsWith('c2-') || lowerName.startsWith('c2d-') || lowerName.startsWith('c3-')) {
      return 'Compute Optimized';
    }
    if (lowerName.startsWith('m1-') || lowerName.startsWith('m2-') || lowerName.startsWith('m3-')) {
      return 'Memory Optimized';
    }
    if (lowerName.startsWith('n1-') || lowerName.startsWith('n2-') || lowerName.startsWith('e2-')) {
      return 'General Purpose';
    }
    return 'General Purpose';
  }
}
