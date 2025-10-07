const FormFooter = ({
  onSwitchToIndividualSignup,
  onSwitchToLogin,
}: {
  onSwitchToIndividualSignup: () => void;
  onSwitchToLogin: () => void;
}) => {
  return (
    <div className="text-center space-y-3">
      <p className="text-sm text-gray-600">
        Want to create an individual account?{" "}
        <button
          type="button"
          onClick={onSwitchToIndividualSignup}
          className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
        >
          Sign up as Individual
        </button>
      </p>

      <p className="text-sm text-gray-600">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};

export default FormFooter;
