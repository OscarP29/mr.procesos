SYSTEM_ACCOUNT_MARKER = "system"


class ProcessClassifier:
    @staticmethod
    def is_system_process(user: str | None) -> bool:
        return SYSTEM_ACCOUNT_MARKER in (user or "").casefold()