## Providers With Size

Alibaba: /providers/alibaba/instancetypes
AWS: /providers/aws/sizes
Azure: /providers/azure/sizes
GCP: /providers/gcp/sizes
Hetzner: providers/hetzner/sizes
OpenStack: /providers/openstack/sizes
KubeVirt: /providers/kubevirt/instancetypes
Digital Ocean: /providers/digitalocean/sizes


## Providers With Issues

- Anexia Doesn't have predefined sizes (Provides Custom Size CPU/Memory in Input Fields)
 But we are getting `/providers/anexia/disk-types` from Anexia API
 See `anexia.json` for reference

 - KubeAdm: Has No Initial Node Step
 - Edge: Has no Settings Section


- Nutanix Issue 

With Preset/With Credentials
 - Provided: Username/Password 
 - Provided Prism Element Settings

 cannot list categories: api error: Post "https://nutanix.dc-proxy.svc:443/api/nutanix/v3/categories/list": dial tcp: lookup nutanix.dc-proxy.svc on 169.254.20.10:53: no such host

- VSphere Doesn't have predefined sizes (Provides Custom Size CPU/Memory in Input Fields)

- VMWareCloud Director Doesn't have predefined sizes (Provides Custom Size CPU/Memory in Input Fields)


