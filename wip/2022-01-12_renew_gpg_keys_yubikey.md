

## Commands

* `gpg2 --edit-key <key-id>`
* `expire`
* It will give you a prompt for how long
* Repeat for each sub key
* `key <<sub-key-id>>` to select the sub key
* `list` show the status of all the keys
* `save` Save the changes


## Exporting the updated key
 * gpg2 --armor --export <<key-id>> > public_key.gpg

## Upload Key to your key server

## Fetch the key
* `gpg2 --card-edit`
* `fetch`

## References:
* https://www.gnupg.org/gph/en/manual/x56.html
