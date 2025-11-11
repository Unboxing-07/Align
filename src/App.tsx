import { Button } from "./components/button"
import { Input } from "./components/input"
import { LineButton } from "./components/LineButton"
import { Logo } from "./components/Logo"

export const App = () => {
  return <div className="size-100"> <Logo />Hello world <Button size="small">Hello world</Button><LineButton>Hello</LineButton> <Input placeholder="hello world" /></div >
}