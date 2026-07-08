import { AuthRequiredError } from "@/services/captures";

const technicalAuthMessages = [
  "auth session missing",
  "invalid refresh token",
  "jwt expired",
  "missing authorization",
  "not authenticated"
];

export function isAuthRequiredError(error: unknown) {
  if (error instanceof AuthRequiredError) {
    return true;
  }

  if (!isErrorLike(error)) {
    return false;
  }

  const errorName = error.name.toLowerCase();
  const errorMessage = error.message.toLowerCase();

  return (
    errorName.includes("authsessionmissing") ||
    technicalAuthMessages.some((message) => errorMessage.includes(message))
  );
}

export function getUserFacingErrorMessage(error: unknown, fallback: string) {
  if (isAuthRequiredError(error)) {
    return "Sign in to continue.";
  }

  return fallback;
}

function isErrorLike(error: unknown): error is { message: string; name: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "name" in error &&
    typeof error.message === "string" &&
    typeof error.name === "string"
  );
}
