import Modal, { TModalProps } from ".";

const ModalProvider = ({ children, ...props }: TModalProps) => {
  return <Modal {...props}>{children}</Modal>;
};
export default ModalProvider;
