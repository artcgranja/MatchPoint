"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SessionActions } from "@/hooks/use-session-actions";

export function SessionActionDialogs({ actions }: { actions: SessionActions }) {
  const tHistory = useTranslations("ChatHistory");
  const tChat = useTranslations("Chat");
  const tCommon = useTranslations("Common");

  return (
    <>
      <AlertDialog open={actions.deleteDialogOpen} onOpenChange={actions.setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tHistory("deleteSessionConfirm", { title: actions.sessionToDelete?.title ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tHistory("deleteSessionDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={actions.confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={actions.renameDialogOpen} onOpenChange={actions.setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tHistory("renameSession")}</DialogTitle>
          </DialogHeader>
          <Input
            value={actions.renameValue}
            onChange={(e) => actions.setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") actions.confirmRename();
            }}
            maxLength={120}
            placeholder={tChat("projectName")}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => actions.setRenameDialogOpen(false)}
              disabled={actions.isRenaming}
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={actions.confirmRename} disabled={actions.isRenaming}>
              {actions.isRenaming ? tCommon("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
