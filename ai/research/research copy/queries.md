⏺ User answered Claude's questions:      
  ⎿  · For the API/CRD changes, should we replace the existing `KubernetesDashboard` field on `ClusterSpec` with a new `Headlamp` field, or 
     keep the old field for backward compatibility and add a new one alongside it? → Add alongside + deprecate
                             
⏺ User answered Claude's questions:      
  ⎿  · Does Headlamp need any user-cluster-side resources (like the current metrics-scraper deployment + RBAC), or should it be purely 
     seed-side with only a kubeconfig connection to the user cluster API server? → Need to investigate first                                 
                                
⏺ User answered Claude's questions:                                                                                                          
  ⎿  · Should the controller be a new standalone controller (like MLA), or should Headlamp resources be managed within the existing          
     Kubernetes cluster reconciler (the same one that currently manages the kubernetes-dashboard)? → Existing cluster reconciler             
     (Recommended)   

⏺ User answered Claude's questions:             
  ⎿  · Should this design also cover the removal/cleanup of the old kubernetes-dashboard code, or focus only on adding Headlamp (with old    
     dashboard removal as a separate future task)? → Add Headlamp only  
