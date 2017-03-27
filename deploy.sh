#!/bin/bash

rsync -avz -e "ssh -i ~/.ssh/Vultr_rsa" cryogen/resources/public/ modulolotus.net:/var/www/html/modulolotus.net/
