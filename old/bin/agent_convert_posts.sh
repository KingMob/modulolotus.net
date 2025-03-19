#!/bin/bash

# Script to convert Cryogen Markdown posts to Astro format
# Excludes the already converted 2019-05-03-my-fav-idm.md file

CRYOGEN_DIR="/Users/matthew/Code/modulolotus.net/cryogen/resources/templates/md/posts"
ASTRO_DIR="/Users/matthew/Code/modulolotus.net/astro/src/content/blog"

# Process each Markdown file in the Cryogen posts directory
for file in "$CRYOGEN_DIR"/*.md; do
    filename=$(basename "$file")
    
    # Skip the already converted file
    if [ "$filename" == "2019-05-03-my-fav-idm.md" ]; then
        echo "Skipping already converted file: $filename"
        continue
    fi
    if [ "$filename" == "2017-07-20-test.md" ]; then
        echo "Skipping already converted file: $filename"
        continue
    fi
    
    echo "Converting $filename..."
    
    # Read the file content
    content=$(cat "$file")
    
    # Extract metadata from Clojure map format
    title=$(echo "$content" | grep -o ':title "[^"]*"' | sed 's/:title "\(.*\)"/\1/')
    
    # Extract the tags line
    tags_line=$(echo "$content" | grep -o ':tags  \[[^]]*\]' | sed 's/:tags  \[\(.*\)\]/\1/')
    
    # Process tags more carefully to preserve multi-word tags
    tags=""
    # Use perl to extract quoted strings properly
    tag_list=$(echo "$tags_line" | perl -ne 'while(/"([^"]+)"/g){print "$1\n"}')
    while IFS= read -r tag; do
        tags="$tags  - $tag\n"
    done <<< "$tag_list"
    
    # Create description from first paragraph
    description=$(echo "$content" | sed -n '/^$/,$p' | grep -v "^$" | head -1)
    if [ ${#description} -gt 160 ]; then
        description="${description:0:157}..."
    fi
    
    # Format the date from the filename (YYYY-MM-DD)
    date=$(echo "$filename" | grep -o '^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}')
    
    # Create the Astro frontmatter
    frontmatter="---\ntitle: \"$title\"\npubDate: $date\ntags:\n$tags"
    frontmatter="${frontmatter}description: \"$description\"\n---\n\n"
    
    # Extract the content (everything after the Clojure map)
    body=$(echo "$content" | sed -n '/^$/,$p' | tail -n +2)
    
    # Combine frontmatter and body
    new_content="$frontmatter$body"
    
    # Write to the new file
    echo -e "$new_content" > "$ASTRO_DIR/$filename"
    
    echo "Converted $filename to Astro format"
done

echo "Conversion complete!"
