aws sso login --profile shantyCB
$env:AWS_PROFILE = "shantyCB"
aws sts get-caller-identity --profile shantyCB

terraform plan -var-file=".\environment\stg.tfvars"
terraform apply -var-file=".\environment\stg.tfvars"

gcloud auth application-default logingcloud config 
set project lawprotect365

az login --use-device-code


terraform apply -var-file=".\environment\dev.tfvars" -target="module.kms_factory"

