import os
import subprocess

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
        except OSError as e:
            print(f"Error renaming {old_path}: {e}")

if __name__ == "__main__":
    main()
