"use client"

import { useMemo, useState } from "react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

const PLACEHOLDER_QUOTE = "Ea aliquip nulla aute sint occaecat irure sunt ex. Ad do ullamco nostrud officia consequat occaecat minim."

const RacingInput = () => {
    const [completedText, completedTextSet] = useState<string>("")
    const [currentInput, currentInputSet] = useState<string>("")

    const quoteProgress = completedText + currentInput;

    const splittedQuote = useMemo(() => PLACEHOLDER_QUOTE.split(""), [])
    const splittedQuoteProgress = useMemo(() => quoteProgress.split(""), [quoteProgress])

    const invalidChars = useMemo(() => {
        let hasErrorOccurred = false;

        return splittedQuoteProgress.reduce((acc: number[], char, idx) => {
            const isCharCorrect = splittedQuote.at(idx) === char;
            if (!isCharCorrect || hasErrorOccurred) {
                hasErrorOccurred = true;
                acc.push(idx)
            }

            return acc;
        }, []);
    }, [splittedQuoteProgress, splittedQuote]);

    const isInputBlocked = useMemo(() => invalidChars.length >= 6, [invalidChars])

    const currentExpectedChar = useMemo(() => (splittedQuote.at(splittedQuoteProgress.length)), [splittedQuote, splittedQuoteProgress])

    return (
        <section className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
            <div className="text-2xl leading-relaxed font-mono bg-slate-50 p-6 rounded-lg border">
                <p>{splittedQuote.map((char, idx) => {
                    const charState = splittedQuoteProgress.length <= idx ? "empty" : ((invalidChars.includes(idx)) ? "invalid" : "valid")
                    return (
                        <span key={idx} className={cn("rounded-sm", (charState === "empty" || char == " ") ? "text-gray-400" : (charState === "invalid" ? "text-red-600 bg-red-200 font-bold" : "text-green-500"))}>{char}</span>
                    )
                })}</p>
            </div>

            {isInputBlocked && <p className="text-red-500 font-bold text-xl">You have a typo! Correct your word and keep going!</p>}

            <Input
                autoFocus
                value={currentInput}
                onChange={(e) => currentInputSet(e.target.value)}
                onKeyDown={(e) => {
                    if (isInputBlocked && e.key !== "Backspace") {
                        e.preventDefault()
                        return
                    }

                    if (e.key === " " && invalidChars.length <= 0) {
                        if (currentExpectedChar === " ") {
                            e.preventDefault()
                            completedTextSet(prev => prev + currentInput + " ")
                            currentInputSet("")
                        }
                    }

                    if (e.key === "Backspace" && currentInput === "" && completedText !== "") {
                        e.preventDefault()
                        const words = completedText.trim().split(" ")
                        const lastWord = words.pop() ?? ""
                        completedTextSet(words.length > 0 ? words.join(" ") + " " : "")
                        currentInputSet(lastWord)
                    }
                }}
            />
        </section>
    );
}

export default RacingInput;