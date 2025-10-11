import React, { useEffect, useRef, useState } from "react";
import DialogContainer from "./DialogContainer";

type ProviderContext = {
  openDialog: (option: DialogOption) => void;
  closeDialog: () => void;
  isAnyModalOpen: boolean;
};

const EMPTY_FUNC = () => {};
const DialogContext = React.createContext<ProviderContext>({
  openDialog: EMPTY_FUNC,
  closeDialog: EMPTY_FUNC,
  isAnyModalOpen: false,
});

export const useDialog = () => React.useContext(DialogContext);

export type DialogParams = {
  children: React.ReactNode;
  open: boolean;
  onClose?: () => void;
};

export type DialogOption = Omit<DialogParams, "open">;
export type DialogContainerProps = DialogParams & {
  onClose: () => void;
};

const DialogProvider = ({ children }: { children: React.JSX.Element }) => {
  const dialogsRef = useRef<DialogParams[]>([]);
  const dialogsToUpdate = dialogsRef.current;
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

  // useEffect(() => {
  //   closeDialog();
  // }, [location.pathname, location.hash, location.search]); // Close dialog when location changes

  const createDialog = (option: DialogOption) => {
    dialogsRef.current = dialogsToUpdate.map((dialog) => ({
      ...dialog,
      open: false, // Close all existing dialogs
    }));

    const newDialog = { ...option, open: true };
    dialogsRef.current.push(newDialog);
    // Ensure state is updated with the new dialogs
    setDialogs([...dialogsRef.current]);
    setIsAnyModalOpen(true);
  };

  const closeDialog = () => {
    dialogsRef.current = dialogsToUpdate.map((dialog) => ({
      ...dialog,
      open: false,
    }));

    setDialogs([...dialogsRef.current]);
    if (isAnyModalOpen) {
      setIsAnyModalOpen(false);
    }
  };

  const [dialogs, setDialogs] = useState<DialogParams[]>(dialogsRef.current);

  //I replaced useRef with useState because useState is more suitable for managing dynamic state that affects rendering, ensuring isAnyModalOpen accurately represents whether any modal is open.
  const contextValue = {
    openDialog: createDialog,
    closeDialog,
    isAnyModalOpen,
  } as ProviderContext;

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {dialogs.map((dialog, i) => {
        const { ...dialogParams } = dialog;

        return (
          <DialogContainer key={i} onClose={closeDialog} {...dialogParams} />
        );
      })}
    </DialogContext.Provider>
  );
};

export default DialogProvider;
