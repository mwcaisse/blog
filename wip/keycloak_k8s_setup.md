
RedHat Blog / OpenShift seems to recommend using a PV, which I don't want to do.
The documentation on the Docker Image shows support for specifying a MySQL database (yay)

1. Connect to my database for persistent storage
1. Add extensions to the docker image



# What I did
Reviewed the docker image documentation and added the necessary environment variables / configuration to the k8s config.
Added secret to store the database credentials
Added an ingress for keycloak

-- Debugging why app keeps restarting
    -- Does my user have correct permissions?
    
https://www.keycloak.org/docs/latest/server_installation/#_database
Need to make sure using utf8 character set, not utf8m4
Need to pass `characterEncoding=UTF-8` as a JDBC param

Making these changes doesn't seem to change that the database fails to be created... With no real other 
    error or message as to why..

## References:
1. Docker Image: https://hub.docker.com/r/jboss/keycloak/
1. KeyCloak Getting Started Guide: https://www.keycloak.org/getting-started/getting-started-kube
1. RedHad Blog: https://www.openshift.com/blog/adding-authentication-to-your-kubernetes-web-applications-with-keycloak