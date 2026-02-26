import NewPromptClient from "./new-prompt-client"

type SearchParams = Record<string, string | string[] | undefined>

export default function NewPromptPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const title = typeof searchParams?.title === "string" ? searchParams.title : ""
  const prompt = typeof searchParams?.prompt === "string" ? searchParams.prompt : ""

  return <NewPromptClient initialTitle={title} initialPrompt={prompt} />
}

