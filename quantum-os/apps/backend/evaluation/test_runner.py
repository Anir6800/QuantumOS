import ast
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class SyntaxCheck:
    passed: bool
    errors: list[str] = field(default_factory=list)


@dataclass
class ComplexityMetrics:
    loc: int
    complexity_score: int
    function_count: int


@dataclass
class SecurityCheck:
    risk_level: str
    findings: list[str] = field(default_factory=list)


@dataclass
class CompletenessCheck:
    is_complete: bool
    incomplete_sections: list[str] = field(default_factory=list)


@dataclass
class TestReport:
    syntax: SyntaxCheck
    complexity: ComplexityMetrics
    security: SecurityCheck
    completeness: CompletenessCheck
    overall_pass: bool
    test_timestamp: str


class CodeTestRunner:
    def analyze(self, code: str, language: str) -> TestReport:
        syntax = self._check_syntax(code, language)
        complexity = self._calculate_complexity(code)
        security = self._detect_security_risks(code)
        completeness = self._check_completeness(code)
        overall_pass = (
            syntax.passed
            and security.risk_level != "high"
            and completeness.is_complete
        )
        return TestReport(
            syntax=syntax,
            complexity=complexity,
            security=security,
            completeness=completeness,
            overall_pass=overall_pass,
            test_timestamp=datetime.now(timezone.utc).isoformat(),
        )

    def _check_syntax(self, code, language) -> SyntaxCheck:
        language = (language or "").lower()
        errors: list[str] = []

        if language == "python":
            try:
                ast.parse(code)
                return SyntaxCheck(passed=True, errors=[])
            except SyntaxError as exc:
                errors.append(f"SyntaxError: {exc.msg} at line {exc.lineno}")
                return SyntaxCheck(passed=False, errors=errors)

        if language in {"js", "javascript", "ts", "typescript"}:
            stack: list[str] = []
            pairs = {")": "(", "}": "{", "]": "["}
            opening = set(pairs.values())
            line = 1
            for ch in code:
                if ch == "\n":
                    line += 1
                if ch in opening:
                    stack.append(ch)
                elif ch in pairs:
                    if not stack or stack.pop() != pairs[ch]:
                        errors.append(f"Unmatched {ch} at line {line}")
                        return SyntaxCheck(passed=False, errors=errors)

            if stack:
                errors.append("Unclosed bracket/brace/parenthesis detected")
                return SyntaxCheck(passed=False, errors=errors)

            common_patterns = [
                (r"\bfunction\s+\w+\s*\(", "function declaration"),
                (r"\b(const|let|var)\s+\w+\s*=\s*\(", "arrow/function assignment"),
                (r"\b(class)\s+\w+", "class declaration"),
            ]
            if not any(re.search(pattern, code) for pattern, _ in common_patterns) and "=>" not in code:
                errors.append("No obvious executable JS/TS structure found")
                return SyntaxCheck(passed=False, errors=errors)
            return SyntaxCheck(passed=True, errors=[])

        errors.append(f"Unsupported language: {language}")
        return SyntaxCheck(passed=False, errors=errors)

    def _calculate_complexity(self, code) -> ComplexityMetrics:
        loc = 0
        complexity_score = 0
        function_count = 0

        for raw_line in code.splitlines():
            line = raw_line.strip()
            if line and not line.startswith("#") and not line.startswith("//"):
                loc += 1

            complexity_score += len(re.findall(r"\b(if|elif|for|while|try|except|catch)\b", line))
            function_count += len(re.findall(r"\b(def|class|async\s+def)\b", line))

        return ComplexityMetrics(loc=loc, complexity_score=complexity_score, function_count=function_count)

    def _detect_security_risks(self, code) -> SecurityCheck:
        findings: list[str] = []
        lowered = code.lower()

        if re.search(r"\beval\s*\(", lowered):
            findings.append("Use of eval() detected")
        if re.search(r"\bexec\s*\(", lowered):
            findings.append("Use of exec() detected")
        if re.search(r"os\.system\s*\(", lowered):
            findings.append("Use of os.system() detected")
        if re.search(r"subprocess\.run\s*\(.*shell\s*=\s*True", lowered, re.DOTALL):
            findings.append("subprocess.run(shell=True) detected")
        if re.search(r"""password\s*=\s*['"].+['"]""", code, re.IGNORECASE):
            findings.append("Hardcoded password-like credential detected")
        if re.search(r"\b(select|insert|update|delete)\b.*\+.*", lowered) or re.search(r"\b(select|insert|update|delete)\b.*%s?", lowered):
            findings.append("Potential SQL string formatting detected")

        high_risk_signals = (
            "Use of eval() detected",
            "Use of exec() detected",
            "Use of os.system() detected",
            "subprocess.run(shell=True) detected",
            "Hardcoded password-like credential detected",
        )

        if any(signal in findings for signal in high_risk_signals):
            risk_level = "high"
        elif not findings:
            risk_level = "low"
        else:
            risk_level = "medium"

        return SecurityCheck(risk_level=risk_level, findings=findings)

    def _check_completeness(self, code) -> CompletenessCheck:
        incomplete_sections: list[str] = []
        markers = {
            "TODO": "TODO marker present",
            "FIXME": "FIXME marker present",
            "pass  # placeholder": "placeholder pass statement present",
            "raise NotImplementedError": "NotImplementedError present",
        }

        for marker, description in markers.items():
            if marker in code:
                incomplete_sections.append(description)

        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    body = node.body
                    if len(body) == 1 and isinstance(body[0], ast.Pass):
                        incomplete_sections.append(f"Empty function body: {node.name}")
        except Exception:
            pass

        return CompletenessCheck(
            is_complete=not incomplete_sections,
            incomplete_sections=incomplete_sections,
        )
