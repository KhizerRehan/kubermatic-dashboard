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

import {MachineTypeOption} from './component';

/**
 * Sample AWS machine types for testing and demonstration
 */
export const SAMPLE_AWS_MACHINE_TYPES: MachineTypeOption[] = [
  {
    name: 't3.small',
    prettyName: 'T3 Small',
    vcpus: 2,
    memory: 2,
    gpus: 0,
    price: 0.024,
    description: 'General Purpose',
    architecture: 'x64',
  },
  {
    name: 't3.medium',
    prettyName: 'T3 Medium',
    vcpus: 2,
    memory: 4,
    gpus: 0,
    price: 0.048,
    description: 'General Purpose',
    architecture: 'x64',
  },
  {
    name: 't3.large',
    prettyName: 'T3 Large',
    vcpus: 2,
    memory: 8,
    gpus: 0,
    price: 0.096,
    description: 'General Purpose',
    architecture: 'x64',
  },
  {
    name: 'c5.large',
    prettyName: 'C5 High-CPU Large',
    vcpus: 2,
    memory: 4,
    gpus: 0,
    price: 0.097,
    description: 'Compute Optimized',
    architecture: 'x64',
  },
  {
    name: 'c5.xlarge',
    prettyName: 'C5 High-CPU Extra Large',
    vcpus: 4,
    memory: 8,
    gpus: 0,
    price: 0.194,
    description: 'Compute Optimized',
    architecture: 'x64',
  },
  {
    name: 'm5.large',
    prettyName: 'M5 General Purpose Large',
    vcpus: 2,
    memory: 8,
    gpus: 0,
    price: 0.115,
    description: 'General Purpose',
    architecture: 'x64',
  },
  {
    name: 'm5.xlarge',
    prettyName: 'M5 General Purpose Extra Large',
    vcpus: 4,
    memory: 16,
    gpus: 0,
    price: 0.23,
    description: 'General Purpose',
    architecture: 'x64',
  },
  {
    name: 'r5.large',
    prettyName: 'R5 Large',
    vcpus: 2,
    memory: 16,
    gpus: 0,
    price: 0.152,
    description: 'Memory Optimized',
    architecture: 'x64',
  },
  {
    name: 'g4dn.xlarge',
    prettyName: 'G4DN Extra Large',
    vcpus: 4,
    memory: 16,
    gpus: 1,
    price: 0.658,
    description: 'GPU Optimized',
    architecture: 'x64',
  },
  {
    name: 'g4dn.2xlarge',
    prettyName: 'G4DN Double Extra Large',
    vcpus: 8,
    memory: 32,
    gpus: 1,
    price: 0.94,
    description: 'GPU Optimized',
    architecture: 'x64',
  },
  {
    name: 'g5.xlarge',
    prettyName: 'G5 Graphics and Machine Learning GPU Extra Large',
    vcpus: 4,
    memory: 16,
    gpus: 1,
    price: 1.258,
    description: 'GPU Optimized',
    architecture: 'x64',
  },
  {
    name: 'p3.2xlarge',
    prettyName: 'P3 High Performance GPU Double Extra Large',
    vcpus: 8,
    memory: 61,
    gpus: 1,
    price: 3.823,
    description: 'GPU Optimized',
    architecture: 'x64',
  },
];

/**
 * Sample GCP machine types for testing
 */
export const SAMPLE_GCP_MACHINE_TYPES: MachineTypeOption[] = [
  {
    name: 'e2-standard-2',
    prettyName: 'E2 Standard 2',
    vcpus: 2,
    memory: 8,
    gpus: 0,
    price: 0.067,
    description: 'General Purpose',
  },
  {
    name: 'e2-standard-4',
    prettyName: 'E2 Standard 4',
    vcpus: 4,
    memory: 16,
    gpus: 0,
    price: 0.134,
    description: 'General Purpose',
  },
  {
    name: 'n2-standard-2',
    prettyName: 'N2 Standard 2',
    vcpus: 2,
    memory: 8,
    gpus: 0,
    price: 0.097,
    description: 'Balanced Performance',
  },
  {
    name: 'c2-standard-4',
    prettyName: 'C2 Standard 4',
    vcpus: 4,
    memory: 16,
    gpus: 0,
    price: 0.21,
    description: 'Compute Optimized',
  },
  {
    name: 'n1-standard-1-nvidia-tesla-t4',
    prettyName: 'N1 Standard 1 + NVIDIA Tesla T4',
    vcpus: 1,
    memory: 3.75,
    gpus: 1,
    price: 0.35,
    description: 'GPU Optimized',
  },
];

/**
 * Sample Azure VM sizes for testing
 */
export const SAMPLE_AZURE_VM_SIZES: MachineTypeOption[] = [
  {
    name: 'Standard_B2s',
    prettyName: 'Standard B2s',
    vcpus: 2,
    memory: 4,
    gpus: 0,
    price: 0.042,
    description: 'General Purpose',
  },
  {
    name: 'Standard_D2s_v3',
    prettyName: 'Standard D2s v3',
    vcpus: 2,
    memory: 8,
    gpus: 0,
    price: 0.096,
    description: 'General Purpose',
  },
  {
    name: 'Standard_F4s_v2',
    prettyName: 'Standard F4s v2',
    vcpus: 4,
    memory: 8,
    gpus: 0,
    price: 0.169,
    description: 'Compute Optimized',
  },
  {
    name: 'Standard_NC6s_v3',
    prettyName: 'Standard NC6s v3',
    vcpus: 6,
    memory: 112,
    gpus: 1,
    price: 3.06,
    description: 'GPU Optimized',
  },
];
