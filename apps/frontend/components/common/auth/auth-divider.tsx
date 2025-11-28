export function AuthDivider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white dark:bg-background px-4 text-gray-500 dark:text-white">OR</span>
      </div>
    </div>
  );
}
