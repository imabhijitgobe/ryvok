"use client"

import { nanoid } from "nanoid"
import { useState, useTransition } from "react"
import { ShuffleIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { createBot, deleteBot, updateBot } from "@/actions/bot"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { insertBotSchema } from "@/db/schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type { z } from "zod"

const BOT_PRESETS = [
  {
    job: "Research assistant",
    instructions:
      "Answer briefly, cite sources, and ask before running anything destructive.",
  },
  {
    job: "Code reviewer",
    instructions:
      "Read the diff first. Point out correctness issues before style. Ask before applying fixes.",
  },
  {
    job: "Writing editor",
    instructions:
      "Cut the fat, keep the voice, and explain every change you suggest.",
  },
  {
    job: "Tutor",
    instructions:
      "Lead with a question. Never give the answer before they have tried.",
  },
] as const

type BotFormValues = z.infer<typeof insertBotSchema>

/**
 * The editable slice of a bot, serialisable so it can cross the server/client
 * boundary into the dialog.
 */
type EditableBot = {
  id: string
  name: string
  avatar: string
  job: string
  instructions: string | null
}

type BotDialogProps = {
  // Pass a bot to open the dialog in edit mode. Remount with `key={bot.id}`
  // when the bot can change, so the form defaults follow it.
  bot?: EditableBot
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

function BotDialog({
  bot,
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: BotDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = (next: boolean) => {
    onOpenChange?.(next)
    setInternalOpen(next)
  }
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [avatar, setAvatar] = useState(() => bot?.avatar ?? nanoid())

  const form = useForm<BotFormValues>({
    resolver: zodResolver(insertBotSchema),
    defaultValues: {
      avatar,
      name: bot?.name ?? "",
      job: bot?.job ?? "",
      instructions: bot?.instructions ?? "",
    },
  })

  function shuffle() {
    const seed = nanoid()
    setAvatar(seed)
    form.setValue("avatar", seed, { shouldDirty: true })
  }

  function applyPreset(preset: (typeof BOT_PRESETS)[number]) {
    form.setValue("job", preset.job, { shouldDirty: true })
    form.setValue("instructions", preset.instructions, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function onSubmit(values: BotFormValues) {
    startTransition(async () => {
      const result = bot
        ? await updateBot({ id: bot.id, ...values })
        : await createBot(values)

      if (result.status === "error") {
        for (const field of ["name", "job", "instructions", "avatar"] as const) {
          const message = result.errors[field]?.[0]
          if (message) {
            form.setError(field, { message })
          }
        }

        toast.add({
          title: bot ? "Could not update the bot" : "Could not create the bot",
          description: result.errors._root?.[0],
        })
        return
      }

      if (!bot) {
        form.reset({ avatar, name: "", job: "", instructions: "" })
      }

      toast.add({
        title: bot ? `${result.name} updated.` : `${result.name} is ready to go.`,
      })
      setOpen(false)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!bot) {
      return
    }

    startDelete(async () => {
      const result = await deleteBot({ id: bot.id })

      if (result.status === "error") {
        toast.add({
          title: "Could not delete the bot",
          description: result.errors._root?.[0],
        })
        return
      }

      setDeleteOpen(false)
      setOpen(false)
      toast.add({ title: `${bot.name} deleted.` })
      router.push("/")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && !bot ? (
        <DialogTrigger
          render={
            <Button variant="secondary" size="lg">
              <PlusIcon data-icon="inline-start" />
              Create a new bot
            </Button>
          }
        />
      ) : null}
      <DialogContent className="sm:max-w-lg">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>{bot ? "Edit bot" : "New bot"}</DialogTitle>
            <DialogDescription>
              {bot
                ? "Update its face, name, or what it does."
                : "Give it a face, a name, and a job to do."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            {BOT_PRESETS.map((preset) => (
              <Button
                key={preset.job}
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => applyPreset(preset)}
              >
                {preset.job}
              </Button>
            ))}
          </div>

          <FieldGroup>
            <Field orientation="horizontal">
              <ChatAvatar
                seed={avatar}
                className="size-12 shrink-0 self-start rounded-xl"
              />
              <FieldContent>
                <FieldTitle>Face</FieldTitle>
                <FieldDescription>
                  Shuffle until you find one you like.
                </FieldDescription>
              </FieldContent>
              <Button type="button" variant="outline" onClick={shuffle}>
                <ShuffleIcon data-icon="inline-start" />
                Shuffle
              </Button>
            </Field>

            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="bot-name">Name</FieldLabel>
              <Input
                id="bot-name"
                placeholder="Ada"
                autoComplete="off"
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.job}>
              <FieldLabel htmlFor="bot-job">Job</FieldLabel>
              <Input
                id="bot-job"
                placeholder="Research assistant"
                autoComplete="off"
                aria-invalid={!!form.formState.errors.job}
                {...form.register("job")}
              />
              <FieldError errors={[form.formState.errors.job]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.instructions}>
              <FieldLabel htmlFor="bot-instructions">
                How it should work
              </FieldLabel>
              <Textarea
                id="bot-instructions"
                rows={4}
                placeholder="Answer briefly, cite sources, and ask before running anything destructive."
                aria-invalid={!!form.formState.errors.instructions}
                {...form.register("instructions")}
              />
              <FieldError errors={[form.formState.errors.instructions]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            {bot ? (
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="destructive"
                      className="sm:mr-auto"
                    >
                      <Trash2Icon data-icon="inline-start" />
                      Delete
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {bot.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes the bot and its chat. It cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      type="button"
                      variant="destructive"
                      disabled={isDeleting}
                      onClick={handleDelete}
                    >
                      Delete bot
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
            <DialogClose
              render={<Button type="button" variant="outline">Cancel</Button>}
            />
            <Button type="submit" disabled={isPending}>
              {bot ? "Save changes" : "Create bot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { BotDialog, type EditableBot }