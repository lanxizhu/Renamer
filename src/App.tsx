import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { invoke } from "@tauri-apps/api/core"
import { ArrowUpIcon, CheckCircle2Icon } from "lucide-react"
import { useState } from "react"
import './App.css'

function App() {
  const [message, setMessage] = useState<string>("");

  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function greet() {
    console.log("Invoking Rust function with message:", message);
      // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
      const res =  await invoke("greet", {
        name: message,
      });
    
      setStatus({ type: "success", message: `Received response from Rust function: ${res}` });
  }

  return (
    <>
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
          Renamer
        </h1>
          <div className="row flex gap-4 items-center justify-center">
            <img src="/src/assets/vite.svg" className="logo vite" alt="Vite logo" />
            <img src="/src/assets/react.svg" className="logo react" alt="React logo" />
            <img
              src="/src/assets/tauri.svg"
              className="logo tauri"
              alt="Tauri logo"
            />
            <img
              src="/src/assets/typescript.svg"
              className="logo typescript"
              alt="typescript logo"
            />
          </div>
          
          <div className="flex gap-4" id="greet-form">
            <Input id="greet-input" placeholder="Enter a name..." value={message} onChange={(e) => setMessage(e.target.value)} />
            <Button variant="outline" onClick={greet}>Greet</Button>
            <Button variant="outline" size="icon" aria-label="Submit">
              <ArrowUpIcon />
            </Button>
        </div>
        
        <div className="status">
          {status && (
            <Alert>
              <CheckCircle2Icon color="green" />
              <AlertTitle>Operation Status</AlertTitle>
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </div>

          <Alert>
            <CheckCircle2Icon />
              <AlertTitle>Payment successful</AlertTitle>
              <AlertDescription>
                Your payment of $29.99 has been processed. A receipt has been sent to
                your email address.
              </AlertDescription>
            </Alert>
        </div>
    </>
  )
}

export default App
