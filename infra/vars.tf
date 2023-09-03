variable "gce_ssh_user" {
  type        = string
  description = "linux username to map the ssh key"
}


variable "gce_ssh_pub_key_file" {
  type        = string
  description = "provide location to the ssh key"
}

variable "machine_type" {
  default     = "f1-micro"
  description = "Instance type"

}

variable "region" {
  default     = "us-west1"
  description = "Default region"

}

variable "zone" {
  default     = "us-west1-a"
  description = "Zone for the VM"
}

