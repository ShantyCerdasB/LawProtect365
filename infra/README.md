aws sso login --profile lawprotect365
$env:AWS_PROFILE = "lawprotect365"
aws sts get-caller-identity --profile lawprotect365

terraform plan -var-file=".\environment\dev.tfvars"
terraform apply -var-file=".\environment\dev.tfvars"

gcloud auth application-default logingcloud config 
set project lawprotect365

az login --use-device-code


terraform apply -var-file=".\environment\dev.tfvars" -target="module.kms_factory"


aws s3 cp sign-uploads.zip s3://lawprotect365-code-develop/sign-uploads.zip --profile lawprotect365
aws s3 cp sign-certificate.zip s3://lawprotect365-code-develop/sign-certificate.zip --profile lawprotect365

