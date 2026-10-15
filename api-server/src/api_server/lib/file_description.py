import win32api


class FileService:
    @staticmethod
    def get_description(path: str | None, process_name: str) -> str:
        default_description = f"Este proceso es {process_name}."

        if not path:
            return default_description

        try:
            translations = win32api.GetFileVersionInfo(
                path, "\\VarFileInfo\\Translation"
            )

            for lang, codepage in translations:
                key = (
                    f"\\StringFileInfo\\{lang:04x}{codepage:04x}"
                    "\\FileDescription"
                )

                try:
                    description = win32api.GetFileVersionInfo(path, key)

                    if description and description.strip():
                        return description.strip()

                except Exception:
                    continue

        except Exception:
            pass

        return default_description