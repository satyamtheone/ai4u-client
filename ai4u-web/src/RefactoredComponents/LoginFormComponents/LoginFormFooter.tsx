const LoginFormFooter = ({
  onSwitchToIndividualSignup,
  onSwitchToOrgSignup,
}: {
  onSwitchToIndividualSignup: () => void;
  onSwitchToOrgSignup: () => void;
}) => {
  return (
    <div className="text-center space-y-3">
      <p className="text-sm text-gray-600">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToIndividualSignup}
          className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
        >
          Sign up as Individual
        </button>
        {" or "}
        <button
          type="button"
          onClick={onSwitchToOrgSignup}
          className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
        >
          Create Organization
        </button>
      </p>

      <button
        type="button"
        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        onClick={() => {
          // Handle forgot password
          console.log("Forgot password clicked");
        }}
      >
        Forgot your password?
      </button>
    </div>
  );
};

export default LoginFormFooter;
