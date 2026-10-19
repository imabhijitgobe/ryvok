"use client"

import { nanoid } from "nanoid"
import { useState, useTransition } from "react"
import { ShuffleIcon, PlusIcon } from "lucide-react"
import { createBot } from "@/actions/bot"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
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

function BotDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [avatar, setAvatar] = useState(() => nanoid())

  const form = useForm<BotFormValues>({
    resolver: zodResolver(insertBotSchema),
    defaultValues: {
      avatar: avatar,
      name: "",
      job: "",
      instructions: "",
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
      const result = await createBot(values)

      if (result.status === "error") {
        form.setError("name", { message: result.errors.name?.[0] })
        toast.add({
          title: "Could not create the bot",
          description: result.errors._root?.[0],
        })
        return
      }

      form.reset({ avatar, name: "", job: "", instructions: "" })
      toast.add({ title: `${result.name} is ready to go.` })
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="secondary" size="lg">
            <PlusIcon data-icon="inline-start" />
            Create a new bot
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>New bot</DialogTitle>
            <DialogDescription>
              Give it a face, a name, and a job to do.
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
            <DialogClose
              render={<Button type="button" variant="outline">Cancel</Button>}
            />
            <Button type="submit" disabled={isPending}>
              Create bot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { BotDialog }