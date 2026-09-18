import os
import zipfile
import sys

def package_project(output_filename: str = "powermind_release.zip"):
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_path = os.path.join(repo_root, output_filename)

    print(f"Creating release package: {output_filename}...")

    # Files or directory prefixes to exclude
    exclude_dirs = {
        ".venv",
        "venv",
        "env",
        "node_modules",
        ".git",
        ".pytest_cache",
        "__pycache__",
        ".idea",
        ".vscode"
    }

    exclude_extensions = {
        ".pyc",
        ".pyo",
        ".pyd",
        ".log"
    }

    total_files = 0
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(repo_root):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.endswith(".egg-info")]

            for file in files:
                if file == output_filename:
                    continue
                ext = os.path.splitext(file)[1].lower()
                if ext in exclude_extensions:
                    continue

                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, repo_root)

                # Ensure we don't accidentally include node_modules under frontend
                if "node_modules" in rel_path.split(os.sep):
                    continue

                zipf.write(abs_path, arcname=rel_path)
                total_files += 1

    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Successfully packaged {total_files} files into {output_filename} ({file_size_mb:.2f} MB)")
    print(f"Absolute Zip Path: {output_path}")

if __name__ == "__main__":
    out_name = sys.argv[1] if len(sys.argv) > 1 else "powermind_release.zip"
    package_project(out_name)
