# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

variable "env_id" {
  type = string
}

variable "deploy_spanner" {
  type    = bool
  default = true
}


variable "spanner_region_id" {
  type        = string
  nullable    = true
  description = "Configuration from https://cloud.google.com/spanner/docs/instance-configurations#available-configurations-multi-region"
}

variable "datastore_region_id" {
  type        = string
  description = "Configuration from https://cloud.google.com/datastore/docs/locations"
}

variable "spanner_processing_units" {
  type = number
}

variable "deletion_protection" {
  type = bool
}

variable "docker_repository_region" {
  type        = string
  description = "Configuration from https://cloud.google.com/datastore/docs/locations"
}

variable "projects" {
  type = object({
    host     = string
    internal = string
    public   = string
  })
}

variable "region_to_subnet_info_map" {
  type = map(object({
    internal    = string
    internal_id = string
    public      = string
  }))
}

variable "vpc_id" {
  type = string
}
