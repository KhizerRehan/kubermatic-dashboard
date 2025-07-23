// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
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

export class KubeLBTenant {
  id?: string;
  name?: string;
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  annotations?: {[key: string]: string};
  spec?: TenantSpec;
}

export class TenantSpec {
  loadBalancer?: LoadBalancerSettings;
  ingress?: IngressSettings;
  gatewayAPI?: GatewayAPISettings;
  dns?: DNSSettings;
  certificates?: CertificatesSettings;
  allowedDomains?: string[];
  AnnotationSettings?: AnnotationSettings;
}

export class LoadBalancerSettings {
  class?: string;
  disable?: boolean;
  limit?: number; // Maximum number of load balancers to create.
}

export class IngressSettings {
  class?: string;
  disable?: boolean;
}

export class GatewayAPISettings {
  class?: string;
  disable?: boolean;
  gateway?: GatewaySettings;
  gatewayAPIsSettings?: GatewayAPIsSettings;
}

class GatewaySettings {
  limit?: number; // Maximum number of gateways to create.
}

class GatewayAPIsSettings {
  disableHTTPRoute?: boolean;
  disableGRPCRoute?: boolean;
  disableTCPRoute?: boolean;
  disableUDPRoute?: boolean;
  disableTLSRoute?: boolean;
}

export class DNSSettings {
  disable?: boolean;
  allowedDomains?: string[]; // List of allowed domains for automated DNS management.
}

export class CertificatesSettings {
  disble?: boolean;
  defaultClusterIssuer?: string; // Default Cluster Issuer for certificates.
  allowedDomains?: string[];
}

export type AnnotatedResource =
  | 'all'
  | 'service'
  | 'ingress'
  | 'gateway'
  | 'httproute'
  | 'grpcroute'
  | 'tcproute'
  | 'udproute'
  | 'tlsroute';

export type Annotations = {[key: string]: string};

export class AnnotationSettings {
  propagatedAnnotations?: Record<string, string>;
  propagateAllAnnotations?: boolean;
  defaultAnnotations?: Record<AnnotatedResource, Annotations>;
}
