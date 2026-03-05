"use client"

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTypingStats } from "@/hooks/use-typing-stats";

type RacingInputProps = {
    onProgressUpdate: (progress: string, wpm: number, accuracy: number) => void;
    isDisabled: boolean;
    quote: string;
    startsAt?: number;
    endsAt?: number;
}

const RacingInput = ({ onProgressUpdate, quote, isDisabled, startsAt, endsAt }: RacingInputProps) => {
    const [completedText, completedTextSet] = useState<string>("")
    const [currentInput, currentInputSet] = useState<string>("")
    const [hasSentFinishUpdate, setHasSentFinishUpdate] = useState(false);

    const quoteProgress = useMemo(() => completedText + currentInput, [completedText, currentInput]);

    const splittedQuote = useMemo(() => quote.split(""), [quote])
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

    const correctCharsCount = useMemo(() => quoteProgress.length - invalidChars.length, [quoteProgress, invalidChars]);

    const { wpm, accuracy, timeElapsed, timeLeft, registerKeystroke } = useTypingStats(
        correctCharsCount,
        false,
        startsAt,
        endsAt
    );

    const isTimeUp = startsAt !== undefined && timeElapsed > 0 && timeLeft <= 0;
    const isFinished = (quoteProgress === quote && invalidChars.length === 0) || isTimeUp;

    const isInputBlocked = invalidChars.length >= 6 || isTimeUp || isDisabled;

    // * moved into useEffect due to mobile keyboard issues
    useEffect(() => {
        if (currentInput.endsWith(" ") && invalidChars.length === 0) {
            const newCompletedText = completedText + currentInput;
            completedTextSet(newCompletedText);
            currentInputSet("");
            onProgressUpdate(newCompletedText, wpm, accuracy);
        }
    }, [currentInput, invalidChars.length, completedText, wpm, accuracy, onProgressUpdate]);

    useEffect(() => {
        if (timeElapsed > 0 && !isFinished) {
            if (invalidChars.length === 0) {
                onProgressUpdate(completedText + currentInput, wpm, accuracy);
            } else {
                onProgressUpdate(completedText, wpm, accuracy);
            }
        }
    }, [timeElapsed, isFinished, onProgressUpdate, completedText, currentInput, wpm, accuracy, invalidChars.length]);

    useEffect(() => {
        if (isFinished && !hasSentFinishUpdate) {
            setHasSentFinishUpdate(true);
            onProgressUpdate(quote, wpm, accuracy);
        }
    }, [isFinished, wpm, accuracy, onProgressUpdate, quote, hasSentFinishUpdate]);

    return (
        <section className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center bg-neutral-50 text-white p-4 rounded-xl border border-neutral-200">
                <div className="text-center px-4">
                    <p className="text-sm text-neutral-400 font-semibold tracking-wider uppercase">WPM</p>
                    <p className="text-4xl font-black text-green-400">{wpm}</p>
                </div>
                <div className="text-center border-l border-r border-neutral-700 px-8">
                    <p className="text-sm text-neutral-400 font-semibold tracking-wider uppercase">Accuracy</p>
                    <p className="text-4xl font-black text-blue-400">{accuracy}%</p>
                </div>
                <div className="text-center px-4">
                    <p className="text-sm text-neutral-400 font-semibold tracking-wider uppercase">Time Left</p>
                    <p className="text-4xl font-black text-black">{timeLeft}s</p>
                </div>
            </div>

            <div className="text-2xl leading-relaxed font-mono bg-neutral-50 p-6 rounded-lg border">
                <p className="select-none">{splittedQuote.map((char, idx) => {
                    const charState = splittedQuoteProgress.length <= idx ? "empty" : ((invalidChars.includes(idx)) ? "invalid" : "valid")
                    return (
                        <span key={idx} className={cn("rounded-sm", (charState === "empty" || char == " ") ? "text-gray-400" : (charState === "invalid" ? "text-red-600 bg-red-200 font-bold" : "text-green-500"))}>{char}</span>
                    )
                })}</p>
            </div>

            {invalidChars.length >= 6 && <p className="text-red-500 font-bold text-xl">You have a typo! Correct your word and keep going!</p>}

            <Input
                autoFocus
                value={currentInput}
                disabled={isDisabled || isTimeUp}
                onChange={(e) => currentInputSet(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key.length === 1) {
                        registerKeystroke();
                    }

                    if (isInputBlocked && e.key !== "Backspace") {
                        e.preventDefault()
                        return
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
};

export default RacingInput;