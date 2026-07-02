#! /usr/bin/env sh

set -e

IMAGE="ghcr.io/rapptorvpn/wg-easy"

cleanup()
{
  remove_build_image
}

get_version_patch()
{
  jq -r .version package.json
}

get_version_minor()
{
  get_version_patch | sed 's/^\([0-9]\.[0-9]\)\.[0-9]$/\1/'
}

get_version_major()
{
  get_version_patch | sed 's/^\([0-9]\)\.[0-9]\.[0-9]$/\1/'
}

parse_args()
{
  local OPTIND OPTARG flag

  while getopts "t:" flag; do
    case "$flag" in
      t) IMAGE_TAG=$OPTARG;;
    esac
  done
}

remove_build_image()
{
  docker image rm "$IMAGE":build-prod > /dev/null
}

main()
{
  parse_args "$@"

  if [ ! -z "$IMAGE_TAG" ]; then
    PROD_TAGS=($IMAGE_TAG)
  else
    PROD_TAGS=("latest" "$(get_version_patch)" "$(get_version_minor)" "$(get_version_major)")
  fi

  docker build . \
    --platform linux/amd64,linux/arm64 \
    --provenance=false \
    --build-arg PORT_FORWARDING_ENABLED=true \
    -t "${IMAGE}:build-prod"

  for TAG in ${PROD_TAGS[@]}; do
    docker tag "$IMAGE":build-prod "$IMAGE:$TAG"
  done
}

trap "cleanup" EXIT
main "$@"
