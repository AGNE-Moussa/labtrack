// Messages de validation DRF affichés sous un champ de formulaire
function FieldErrors({ messages }: { messages?: string[] }) {
  if (!messages) {
    return null
  }

  return (
    <>
      {messages.map((message) => (
        <p key={message} role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ))}
    </>
  )
}

export default FieldErrors
