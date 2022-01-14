#!/bin/bash

attempt_counter=0
max_attempts=20

until $(curl --output /dev/null --head --fail http://localhost:8080); do
    if [[ ${attempt_counter} -eq ${max_attempts} ]]; then
        echo "Max attempts reached, aborting!"
        exit 1
    fi

    printf "."
    attempt_counter=$(($attempt_counter + 1))
    sleep 5
done
