import os
import subprocess
import glob

def get_webp_jpgs(root_dir):
    misnamed_files = []
    # Find all jpg files
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.lower().endswith('.jpg'):
                filepath = os.path.join(dirpath, filename)
                # Check actual file type
                try:
                    result = subprocess.run(['file', filepath], capture_output=True, text=True)
                    if 'Web/P' in result.stdout:
                        misnamed_files.append(filepath)
                except Exception as e:
                    print(f"Error checking {filepath}: {e}")
    return misnamed_files

def update_references(root_dir, old_name, new_name):
    # We only assume references are in .md, .astro, .js, .json files in src
    extensions = ['.md', '.astro', '.js', '.json', '.yaml']
    
    # We strictly want to replace the filename. 
    # Since these are image assets, they are likely referenced by basename.
    old_basename = os.path.basename(old_name)
    new_basename = os.path.basename(new_name)
    
    print(f"Updating references from {old_basename} to {new_basename}...")

    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            if any(filename.endswith(ext) for ext in extensions):
                filepath = os.path.join(dirpath, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if old_basename in content:
                        new_content = content.replace(old_basename, new_basename)
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated reference in {filepath}")
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

def main():
    root_dir = '/Users/oli/Code/olizilla/lois.me.uk/src'
    files = get_webp_jpgs(root_dir)
    print(f"Found {len(files)} misnamed WebP files.")
    
    for old_path in files:
        # Construct new path
        directory = os.path.dirname(old_path)
        filename = os.path.basename(old_path)
        new_filename = os.path.splitext(filename)[0] + '.webp'
        new_path = os.path.join(directory, new_filename)
        
        # Rename file
        print(f"Renaming {old_path} -> {new_path}")
        try:
            os.rename(old_path, new_path)
            
            # Update references
            update_references(root_dir, old_path, new_path)
        except OSError as e:
            print(f"Error renaming {old_path}: {e}")

if __name__ == "__main__":
    main()
