//  gcloud auth application-default login
// export GOOGLE_PROJECT=..
provider "google" {
  project = var.google_project
}

resource "google_compute_network" "vpc_network" {
  name                    = "training-vpc"
  auto_create_subnetworks = false
  mtu                     = 1460
}

resource "google_compute_subnetwork" "default" {
  name          = "public-facing-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.vpc_network.id
}

resource "google_compute_firewall" "ssh" {
  name = "allow-ssh"
  allow {
    ports    = ["22"]
    protocol = "tcp"
  }
  direction     = "INGRESS"
  network       = google_compute_network.vpc_network.id
  priority      = 1000
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["ssh"]
}

resource "google_compute_firewall" "rabbitmq" {
  name = "allow-rabbitmq"
  allow {
    ports    = ["15672"]
    protocol = "tcp"
  }
  direction     = "INGRESS"
  network       = google_compute_network.vpc_network.id
  priority      = 1000
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["rabbitmq"]
}

resource "google_compute_firewall" "http" {
  name = "allow-http"
  allow {
    ports    = ["80", "8080"]
    protocol = "tcp"
  }
  direction     = "INGRESS"
  network       = google_compute_network.vpc_network.id
  priority      = 1000
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["http"]
}


# Create a single Compute Engine instance
resource "google_compute_instance" "rabbitmq" {
  name         = "rabbitmq-vm-${count.index}"
  machine_type = var.machine_type
  zone         = var.zone

  tags  = ["ssh", "rabbitmq", "http"] 
  count = var.students

  metadata = {
    ssh-keys = "${var.gce_ssh_user}:${file(var.gce_ssh_pub_key_file)}"
  }


  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  # Install everything
  metadata_startup_script = "${file(var.script)}"

  network_interface {
    subnetwork = google_compute_subnetwork.default.id

    access_config {
      # Include this section to give the VM an external IP address
    }
  }
}

output "ip" {
  value = "${google_compute_instance.rabbitmq[*].network_interface.0.access_config.0.nat_ip}"
}