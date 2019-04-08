const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBondaryDetection = require('sbd')

async function robot(content) {
    await fetchContentFromWikipedia(content)
    sanitizedContent(content)
    breakContentIntoSentences(content)

    async function fetchContentFromWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
        const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponse.get()
        content.sourceContentOriginal = wikipediaContent.content
    }

    function sanitizedContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withoutDatesParenthesis = removeDatesParentesis(withoutBlankLinesAndMarkdown)

        content.sourceContentSanitized = withoutDatesParenthesis

        function removeBlankLinesAndMarkdown(text){
            const allLines = text.split('\n')

            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                if(line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false
                }
                return true
            })

            return withoutBlankLinesAndMarkdown.join(' ')
        }

        function removeDatesParentesis(text){
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ')
        }
    }

    function breakContentIntoSentences(content){
        content.sentences = []
        const sentences = sentenceBondaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
    }
}

module.exports = robot