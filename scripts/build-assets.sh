#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /absolute/path/to/tx网站必备文件.zip" >&2
  exit 2
fi

archive=$1
repo_root=$(cd "$(dirname "$0")/.." && pwd -P)
work_dir=$(mktemp -d /tmp/tanxin-assets.XXXXXX)
trap 'rm -rf "$work_dir"' EXIT

mkdir -p "$repo_root/assets/images" "$repo_root/assets/video" "$repo_root/assets/data"
find "$repo_root/assets/images" -type f -delete
find "$repo_root/assets/video" -type f -delete

unzip -q "$archive" -d "$work_dir/source"
source_root="$work_dir/source/tx网站必备文件"

while IFS= read -r -d '' nested; do
  destination=${nested%.zip}
  mkdir -p "$destination"
  unzip -q "$nested" -d "$destination"
done < <(find "$source_root" -maxdepth 1 -type f -name '*.zip' -print0)

manifest_tsv="$work_dir/manifest.tsv"
: > "$manifest_tsv"

group_for_path() {
  case "$1" in
    *'/实习经历(1)/'*) echo internship ;;
    *'/海报设计(1)/'*) echo posters ;;
    *'/包装设计(1)/'*) echo packaging ;;
    *'/其他设计(1)/'*) echo other ;;
    *'/板式设计(1)/'*) echo editorial ;;
    *'/简历和证件照(1)/'*) echo profile ;;
    *) echo uncategorized ;;
  esac
}

declare -A counters

next_id() {
  local group=$1
  local value=$(( ${counters[$group]:-0} + 1 ))
  counters[$group]=$value
  printf -v next_id_value '%s-%02d' "$group" "$value"
}

add_row() {
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$@" >> "$manifest_tsv"
}

while IFS= read -r -d '' input; do
  group=$(group_for_path "$input")
  next_id "$group"
  id=$next_id_value
  output="assets/images/$id.webp"
  MAGICK_TMPDIR="$work_dir" convert -limit memory 512MiB -limit map 1GiB \
    -define jpeg:size=2600x2600 "$input" -auto-orient -strip \
    -resize '2400x2400>' -quality 84 "$repo_root/$output"
  read -r width height < <(identify -format '%w %h\n' "$repo_root/$output")
  source_path=${input#"$work_dir/source/"}
  add_row "$id" image "$group" "$source_path" "$output" "$width" "$height" ''
done < <(find "$source_root" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) ! -path '*/__MACOSX/*' -print0 | sort -z)

pdf="$source_root/包装设计(1)/包装设计/js23210530谭鑫.pdf"
pdftoppm -jpeg -r 145 "$pdf" "$work_dir/pdf-page" >/dev/null 2>&1
for input in "$work_dir"/pdf-page-*.jpg; do
  next_id packaging
  id=$next_id_value
  output="assets/images/$id.webp"
  MAGICK_TMPDIR="$work_dir" convert -limit memory 512MiB -limit map 1GiB \
    "$input" -auto-orient -strip -resize '2400x2400>' -quality 84 "$repo_root/$output"
  read -r width height < <(identify -format '%w %h\n' "$repo_root/$output")
  source_path=${pdf#"$work_dir/source/"}
  add_row "$id" image packaging "$source_path" "$output" "$width" "$height" ''
done

video_counter=0
while IFS= read -r -d '' input; do
  video_counter=$((video_counter + 1))
  id=$(printf 'video-%02d' "$video_counter")
  output="assets/video/$id.mp4"
  poster="assets/images/$id-poster.webp"
  ffmpeg -nostdin -loglevel error -y -i "$input" \
    -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p \
    -c:a aac -b:a 128k -movflags +faststart "$repo_root/$output"
  ffmpeg -nostdin -loglevel error -y -ss 00:00:03 -i "$repo_root/$output" \
    -frames:v 1 -vf 'scale=1600:-2' "$work_dir/$id-poster.jpg"
  convert "$work_dir/$id-poster.jpg" -strip -quality 84 "$repo_root/$poster"
  read -r width height < <(ffprobe -v error -select_streams v:0 \
    -show_entries stream=width,height -of csv=s=x:p=0 "$repo_root/$output" | tr x ' ')
  source_path=${input#"$work_dir/source/"}
  add_row "$id" video video "$source_path" "$output" "$width" "$height" "$poster"
done < <(find "$source_root" -type f -iname '*.mp4' ! -path '*/__MACOSX/*' -print0 | sort -z)

node "$repo_root/scripts/make-manifest.mjs" "$manifest_tsv" "$repo_root/assets/data/asset-manifest.json"
echo "Built $(wc -l < "$manifest_tsv" | tr -d ' ') web assets."
