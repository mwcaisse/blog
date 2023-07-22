---
title: Setting up SonarQube
date: 2021-12-30
tags:
- sonarqube
- SCA
author: Mitchell Caisse
---

Documenting the process for how I set up Sonarqube

## Setting up SonarQube

Create the directory to host the data for Sonarqube, its service configuration, and docker compose file.

```bash
mkdir /opt/sonarqube

mkdir /opt/sonarqube/data

# Directory to store the data for the database
mkdir /opt/sonarqube/data/db
# Directory to store the data for sonarqube (data files, H2 database, Elasticsearch indexes)
mkdir /opt/sonarqube/data/sonarqube
# Directory to store the sonarqube logs around access, web process, CE process, and Elasticsearch
mkdir /opt/sonarqube/data/logs
# Directory to store any plugins installed
mkdir /opt/sonarqube/data/extensions
```

Create a docker-compose file

`/opt/sonarqube/docker-compose.yml`
```yaml
version: "3"

services:
  db:
    image: postgres:13 # Lock at 13, Sonarqube doesn't show support for 14 yet
    environment:
      POSTGRES_DB: sonarqube
      POSTGRES_USER: sonarqube
      POSTGRES_PASSWORD: password
    volumes:
      - ./data/db:/var/lib/postgresql/data
    logging:
      driver: "json-file"
      options:
        max-file: "5"
        max-size: "10m"
    healthcheck:
      test: psql sonarqube --command "select 1" -U sonarqube
      
  sonarqube:
    image: sonarqube:community
    depends_on:
      - db
    ports:
      - "9000:9000"    
    volumes:
      - ./data/sonarqube:/opt/sonarqube/data
      - ./data/extensions:/opt/sonarqube/extensions
      - ./data/logs:/opt/sonarqube/logs
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://db:5432/sonarqube
      SONAR_JDBC_USERNAME: sonarqube
      SONAR_JDBC_PASSWORD: password

```

### Errors
Might run into hte following error when postgres database is configured
```
sonarqube bootstrap check failure [1] of [1]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
```
Running `sysctl -w vm.max_map_count=262144` on host machine fixes this. This doesn't persist between boots though.

To persist these changes after boot
`/etc/sysctl.d/99-sysctl.conf`
```
vm.max_map_count=262144
```

Ref: 
* https://github.com/SonarSource/docker-sonarqube/issues/282
* https://wiki.archlinux.org/title/sysctl

### Systemd Service

`/opt/sonarqube/sonarqube-docker.service`
```
[Unit]
Description=Runs Sonarqube and its database in a docker container
Requires=docker.service
After=docker.service

[Service]
User=root
Restart=on-failure
WorkingDirectory=/opt/sonarqube/
ExecStart=/usr/bin/docker-compose up

[Install]
WantedBy=multi-user.target
```

Create a symlink to the service so systemd can see it
`ln -s /opt/sonarqube/sonarqube-docker.service /etc/systemd/system/sonarqube-docker.service`

Enable the service
`systemctl enable sonarqube-docker.service`

### Reverse Proxy
Setup the domain to use for sonarqube



TODO: Figure out how much of these files to keep here

Add the redirect to HTTPS
`/etc/httpd/conf/httpd.conf`
```
<VirtualHost *:80>
    ServerName sonar.fourfivefire.com
    ServerAlias *.sonar.fourfivefire.com
    Redirect permanent / https://sonar.fourfivefire.com/
</VirtualHost>
```

Save the file then restart apache
`sudo systemctl restart httpd`

Request the SSL certificate for the new domain
`certbot --apache`

No we can add the configuration for HTTPS serve
`/etc/httpd/conf/extra/httpd-ssl.conf`
```
<VirtualHost _default_:443>
    #   General setup for the virtual host
    DocumentRoot "/srv/http-sonar"
    ServerName sonar.fourfivefire.com:443
    ServerAdmin admin@fourfivefire.com
    ErrorLog "/var/log/httpd/error_log"
    TransferLog "/var/log/httpd/access_log"

    SSLProxyEngine on
    ProxyRequests off
    ProxyPreserveHost off

    RewriteEngine on

    ProxyPass / http://192.168.1.166:9000/ nocanon
    ProxyPassReverse / http://192.168.1.166:9000/


    AllowEncodedSlashes NoDecode

    <Proxy>
        Order deny,allow
        Allow from all
    </Proxy>

    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

    #   SSL Engine Switch:
    #   Enable/Disable SSL for this virtual host.
    SSLEngine on

    <FilesMatch "\.(cgi|shtml|phtml|php)$">
        SSLOptions +StdEnvVars
    </FilesMatch>
    <Directory "/srv/http-ci/cgi-bin">
        SSLOptions +StdEnvVars
    </Directory>

    BrowserMatch "MSIE [2-5]"nokeepalive ssl-unclean-shutdown downgrade-1.0 force-response-1.0 


    CustomLog "/var/log/httpd/ssl_request_log""%t %h %{SSL_PROTOCOL}x %{SSL_CIPHER}x \"%r\" %b"

    ServerAlias sonar.fourfivefire.com
    Include /etc/letsencrypt/options-ssl-apache.conf
    SSLCertificateFile /etc/letsencrypt/live/sonar.fourfivefire.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/sonar.fourfivefire.com/privkey.pem
</VirtualHost>
```

## Authentication with Github
https://docs.sonarqube.org/latest/analysis/github-integration/


## Configure Scan in CI/CD

### .NET
Generate a token to use to login

Drone CI's plugin for Sonarqube uses the generic scanner, but for .NET there is a  scanner for .NET, we'll use that one.

Need to install the scanner, start the scan, run the build, then publish the results. Which can be accomplished with the following
```bash
dotnet tool install --global dotnet-sonarscanner
dotnet sonarscanner begin /k:"$${SONARQUBE_PROJECT_NAME}" /v:"$${DRONE_COMMIT}" /d:sonar.host.url="$${SONARQUBE_HOST}"  /d:sonar.login="$${SONARQUBE_TOKEN}"
dotnet build
dotnet sonarscanner end /d:sonar.login="$${SONARQUBE_TOKEN}"
```

Where:
* `SONARQUBE_PROJECT_NAME` is the name of the project is Sonarqube
* `SONARQUBE_HOST` is the base url to your sonarqube instance
* `SONARQUBE_TOKEN` is the token generated / to auth with sonarqube

You'll need to make sure that java is installed as well, as sonarqube uses java to upload the results. On debian you can do
```bash
apt update
apt install -y default-jre
```

Refs:
* https://docs.sonarqube.org/latest/analysis/scan/sonarscanner-for-msbuild/
* https://plugins.drone.io/aosapps/drone-sonar-plugin/


#### Test Coverage

Sonarqube supports a few coverage tools, most relevant for this as we are running on linux containers is dotCover and altCover.
The post around coverage tools doesn't mention altcover though and dotCover looks to be distributed for free. For this
we'll continue forward with dotCover

Install dotCover .NET global tool
```bash
dotnet tool install --global JetBrains.dotCover.GlobalTool
```

Run the tests with coverage, we want to output in HTML, since sonarqube only supports dotCover reports in HTML format
```bash
dotnet dotcover test --dcReportType=HTML --dcOutput=./coverage.html
```


Update your begin command to pass in the path to generated coverage report
```bash
dotnet sonarscanner begin /k:"$${SONARQUBE_PROJECT_NAME}" /d:sonar.host.url="$${SONARQUBE_HOST}"  /d:sonar.login="$${SONARQUBE_TOKEN}" /d:sonar.cs.dotcover.reportsPaths="./coverage.html""
```

Note the `/d:sonar.cs.dotcover.reportsPaths="./coverage.html" at the end.

#### Test Results

If we want to capture test results as well, we can modify our command to run the tests with coverage to also output a test report

```bash
dotnet dotcover test --dcReportType=HTML --dcOutput=./coverage.html -r ./test_output --logger trx 
```

By adding `-r ./test_output --logger trx` we tell dotnet the folder to output the test results to `./test_output` and the format `trx` which is 
Visual Studio's test results format.

We can tell sonarqube to include test reports by adding `/d:sonar.cs.vstest.reportsPaths="./test_output/*.trx"` to the build command

Refs:
* https://community.sonarsource.com/t/coverage-test-data-generate-reports-for-c-vb-net/9871
* https://www.jetbrains.com/help/dotcover/Running_Coverage_Analysis_from_the_Command_LIne.html#basic


### Python

There isn't a specific sonar scanner for Python, so we'll have to use the generic one. Which we can do by downloading it

```bash
mkdir /sonar
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.6.2.2472-linux.zip -O /sonar/sonar-scanner-cli.zip
unzip /sonar/sonar-scanner-cli.zip -d /sonar/
mv /sonar/sonar-scanner-*/* /sonar/ # remove the sonar-<<version>> folder
- export PATH="$PATH:/sonar/bin"
```

The second to last command there removes the folder with the version name in it, which should make this easier to update as the version changed
(or switch to a `latest` url if one exists)

Now we can run the scanner command, which is relativly simple, since we set up most of the sonar config in the properties file.
But we still need to set up server / auth information.
```bash
sonar-scanner -Dsonar.login="$${SONARQUBE_TOKEN}" -Dsonar.host.url="$${SONARQUBE_HOST}" -Dsonar.projectVersion="$${DRONE_COMMIT}"
```

We'll need to create a configuration for the project, which we can do by creating a `sonar-project.properties` in the root directory of the project
```
sonar.projectKey=<<project-id>>
sonar.sources=app.py,app/
sonar.tests=tests/
sonar.sourceEncoding=UTF-8
sonar.python.version=3.10
```

Here we can specify the source and test directories for the project, as well as the project key, and version of python you are targeting.
For the `sonar.sources` and `sonar.tests` properties, I wasn't able to get wild carding working for the directory paths, but specifying just
the directories worked.

#### Test Coverage

`coverage` output format is supported by Sonarqube, so you can use it to generate coverage reports.

To get it working, you'll need to run your unit tests with coverage, then print out the coverage report.

```bash
python -m coverage run -m unittest
python -m coverage xml -i
```

We'll need to tell sonarqube where to find the coverage reports, which by default, coverage outputs to the project directory
into a file called `coverage.xml`

`sonar-project.properties`
```
sonar.python.coverage.reportPaths=coverage.xml
```

#### Test Results

If you're using `unittest` as your testing library, you can install `unittest-xml-reporting` to generate XML reports for your testing runs.

You'll want to update your CI script to run unit tests with xmlrunner instead.
```bash
- python -m coverage run -m xmlrunner --output-file test_report.xml
```

`--output-file` specifies the file to output the test reports to, and outputs one file. `-o <directory>` can be used to output
the reports to the given directory, however when I tried I received a duplication error when trying to read in the test reports. Outputting
to a single file solved that.

We need to update our `sonar-project.properties` to tell sonarqube where to find the rest reports

```
sonar.python.xunit.reportPath=test_report.xml
```

Refs:
* https://pypi.org/project/unittest-xml-reporting/
* https://docs.sonarqube.org/latest/analysis/coverage/

### JS

Similar to the python configuration

#### Test Coverage

Use `jest-sonar` to output test run information into format sonarqube can understand.

Configure jest to output test report, in your jest config or package.json
```json
{
  "jest": {
    "reporters": ["default", ["jest-sonar", {
      "outputName": "sonar-test-report.xml"
    }]]
  }
}
```

The default config would also work, by default it outputs to `sonar-report.xml`, but I explicitly set it to `sonar-test-report.xml` just to
isolate against any changes.


Configure the path to the test report in `sonar-project.properties`
```
sonar.testExecutionReportPaths=coverage/sonar-test-report.xml
```

Note: Jest seems to put it in coverage folder in the root directory of the project by default

We can add the `--coverage` flag to jest to run with test coverage. I created a new script to run jest with coverage;
`package.json`
```json
{
  "scripts": {
    "test": "jest --runInBand",
    "coverage": "jest --runInBand --coverage"
  }
}
```

Update your CI/CD script to run test coverage
```bash
yarn coverage
```

When using test coverage, you need to specify the sources and test files so sonarqube knows which files are tests, otherwise
you might see an error like 
```
ERROR: Error during SonarScanner execution
ERROR: Error during parsing of generic test execution report '/drone/src/coverage/sonar-test-report.xml'. Look at the SonarQube documentation to know the expected XML format.
ERROR: Caused by: Line 2 of report refers to a file which is not configured as a test file: src/test/components/Recipe/Recipe.test.js
```

`sonar-project.properties`
```
sonar.sources=src/main
sonar.tests=src/test/
```

## Future Improvements
We can probably streamline the images that are using for running sonarqube. Having an image that already has sonarqube scanner installed
will save us the trouble of needing to install it each time. Similarly for .NET having an image with java already installed and
the needed tools will help.

## References
* https://docs.sonarqube.org/latest/setup/install-server/
