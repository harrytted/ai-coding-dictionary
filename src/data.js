export const categories = [
  { id: 'model', name: '模型基础', en: 'THE MODEL', color: '#597b93' },
  { id: 'context', name: '会话与上下文', en: 'SESSIONS & CONTEXT', color: '#6b8c75' },
  { id: 'tools', name: '工具与环境', en: 'TOOLS & ENVIRONMENT', color: '#b28757' },
  { id: 'failure', name: '局限与失误', en: 'FAILURE MODES', color: '#b46d64' },
  { id: 'handoffs', name: '任务交接', en: 'HANDOFFS', color: '#8d7ca3' },
  { id: 'memory', name: '记忆与引导', en: 'MEMORY & STEERING', color: '#5e9594' },
  { id: 'work', name: '工作方式', en: 'PATTERNS OF WORK', color: '#969252' },
];
const groups = [
`ai|AI|人工智能|让计算机完成通常需要人类智能的任务的一类方法与系统。|AI 是一个宽泛领域，包含机器学习、计算机视觉、规划等方向。AI 编程工具通常以大语言模型为核心，但模型、工具与产品并不是同一个概念。|代码助手根据报错解释原因，是 AI 的一种应用。 
cache-tokens|Cache tokens|缓存命中词元|本次请求中命中提示词缓存、可复用先前输入计算结果的词元（Token）。|这里指缓存读取命中的输入词元数量，不是模型的长期记忆，也不是缓存中存放的所有词元。服务商可能用 cached_tokens 或 cache_read_input_tokens 等字段统计；创建或写入缓存的词元可能另行统计。前缀缓存是复用机制，缓存命中词元是该机制在一次请求中的命中量。“缓存命中词元”是本词典为说明含义采用的中文名称，并非唯一标准译名。|一次请求有 2,000 个输入词元，其中 1,500 个命中缓存，则本次缓存命中词元数为 1,500；其余 500 个仍需要处理。
effort|Effort|推理强度|用于调节模型完成任务时投入程度的设置。|在本词典中，Effort 译为“推理强度”。部分模型用它调节推理预算，另一些实现也可能影响工具使用和回答详尽程度；它不同于控制采样随机性的温度参数。提高强度通常会增加等待时间或推理词元用量，但不能保证答案正确。可用档位与实际效果取决于模型和服务实现。|排查复杂并发故障时提高推理强度，修改文案时使用较低档位。
harness|Harness|智能体运行框架|让模型能够使用工具、管理上下文并持续执行任务的软件运行层。|模型生成回答或工具调用请求，智能体运行框架负责检查授权、执行工具、回传结果并继续任务循环。它还可能管理会话、上下文压缩和停止条件。Harness 在这里强调模型外围的执行与编排，不等同于训练模型的机器学习框架。|代码助手接到文件读取请求后，真正打开文件的是智能体运行框架。
inference|Inference|模型推理|使用训练好的模型处理输入、生成输出的计算过程。|Inference 通常译为“推理”，这里使用“模型推理”来突出它是模型运行过程。它与 reasoning（逻辑推理或推理思考）不同：生成一句普通回复也属于模型推理，模型不必进行复杂推理思考。常规推理调用通常不会更新模型权重。|向模型发送一段代码并获得解释，就是一次推理调用。
input-tokens|Input tokens|输入词元|本次请求中送入模型的词元，包括指令、资料、历史消息等。|系统提示词、工具定义、会话历史、检索资料和工具返回结果都可能占用输入词元。多模态输入也可能按服务规则折算为词元或其他用量。不同服务对输入总量、缓存命中和缓存写入的统计口径可能不同，不能仅凭某个字段名推断总用量。|将多个源文件附到请求中，会增加输入词元；其中一部分可能命中提示词缓存。
model-provider-request|Model provider request|模型调用请求|应用向模型服务发起的一次生成或推理请求。|一次用户提问可能需要多次模型调用请求：模型先请求读取文件，收到工具返回结果后，再生成后续操作或回复。它与工具调用不同，也不必与一个交互回合一一对应；一次流式响应中的多个数据片段通常仍属于同一次请求。|助手先调用模型决定查文件，再调用模型分析读取结果。
model-provider|Model provider|模型服务提供方|通过接口提供模型推理能力的云端服务商或本地服务。|模型服务提供方负责承接调用并运行模型。它可以是云端服务，也可以是本地推理服务；不一定就是模型的训练者。要区分模型本身、承载模型的服务，以及使用该服务的编程助手。|一个编辑器可以连接云端模型，也可以连接本地模型服务。
model|Model|模型|从训练数据中学到模式、根据输入生成输出的计算系统。|在语言模型中，权重编码了训练获得的模式，运行时根据上下文预测后续词元。访问文件、执行命令和持久记忆通常由外围系统提供。|模型提出运行测试，工具系统实际执行测试。
next-token-prediction|Next-token prediction|下一词元预测|根据已有上下文预测后续词元，再逐步生成完整序列的机制。|在常见的自回归生成中，语言模型反复预测并追加词元，形成文字、代码或结构化工具调用。预测的是词元而不是固定意义上的“下一个单词”，因为一个词可能被拆成多个词元。这个生成过程也不等于从数据库检索一条现成答案。|给定“function add(a, b)”，模型继续生成函数体。
non-determinism|Non-determinism|非确定性|相同输入在不同运行中可能得到不同结果的现象。|采样设置、后端计算及服务实现都可能影响结果。即使温度较低，也不应假定输出完全一致。对自动化流程，应该验证行为与约束而不是逐字匹配答案。|同一需求运行两次，助手可能选用不同但都合理的实现。
output-tokens|Output tokens|输出词元|模型在本次请求中生成的词元。|输出词元可以承载可见回复、代码和结构化工具调用。部分服务还会将推理过程中的词元计入输出用量或单独列示，因此用量不一定等于屏幕上可见文字的长度。具体统计方式以所用服务的说明为准。|生成一份长报告比只返回一句结论通常消耗更多输出词元。
parameters|Parameters|模型参数|训练过程中被优化、决定模型行为的数值，也常称为权重。|模型参数是训练过程中被优化的数值，在语言模型语境中常统称为权重。它们不同于学习率等训练超参数，也不同于当前会话中的文字。发送新消息通常只改变上下文，不直接修改权重；参数规模本身也不能单独决定模型表现。|给模型一份新 API 文档是在补充上下文，不是重新训练模型。
prefix-cache|Prefix cache|前缀缓存|复用请求开头相同内容的计算结果的一种缓存机制。|前缀缓存复用请求开头相同部分的处理结果，可能减少重复计算。稳定的指令与资料通常适合放在前面。它是缓存机制；“缓存命中词元”则是一次请求中复用该机制的输入词元用量。缓存不等于长期记忆，也不会扩大上下文窗口。|保持项目指令不变，只把本轮问题追加到末尾。
token|Token|词元|词元（Token）是模型对内容进行编码和处理的基本单位。|一个词元可能对应一个词、词的一部分、一个或多个字符、标点或字节片段；多模态内容也有对应的编码方式。中文字符与词元不是固定的一一对应关系。准确数量要使用目标模型的分词器或服务提供的用量统计。|“智能体”在不同分词器中可能被拆成不同数量的词元。
training|Training|训练|通过数据和优化算法调整模型参数的过程。|预训练帮助模型学习通用模式，后续训练可以改善指令遵循或特定能力。训练与在对话中提供资料不同；后者通常只对当前上下文产生作用。|用代码数据优化模型权重属于训练；让助手读 README 属于提供上下文。`,
`agent|Agent|智能体|围绕目标，利用模型选择行动、调用工具并根据结果继续工作的系统。|一个常见循环是观察、决策、执行和反馈。智能体能做什么取决于工具、权限、任务边界与停止条件，而不只取决于模型本身。|助手定位报错、修改代码、运行测试，再根据失败结果继续修复。
context-window|Context window|上下文窗口|模型一次处理可容纳的上下文范围，通常以词元数量衡量。|指令、输入资料、会话历史、工具返回结果和生成内容都会涉及上下文预算；输入与输出如何共享总容量、各自上限是多少，取决于具体模型。上下文窗口装得下资料，不代表模型能够同样可靠地利用其中每条信息。|超长日志挤占窗口后，早先的重要约束可能需要被摘要或重新提供。
context|Context|上下文|本次任务中提供给模型、帮助它理解和判断的信息。|上下文是模型本次实际看到的信息，而不是电脑上存在的全部内容。相关代码、任务约束、文档和最新检查结果都可以成为上下文。它不同于上下文窗口：前者指信息内容，后者指模型一次可处理的范围和容量。|修改登录流程前，先提供认证代码、错误日志和期望行为。
session|Session|会话|一段由应用维护的连续交互过程。|应用在会话中保存消息与工具返回结果，并选择哪些内容传给下一次模型请求。关闭界面、清空历史或压缩上下文是否形成新会话，取决于产品实现。|围绕一个缺陷连续讨论、改代码和验证，可以组成一个会话。
stateful|Stateful|有状态|系统能保留先前操作产生的信息，并在后续操作中使用。|状态可能保存在会话记录、数据库、文件或其他存储中。模型服务本身的调用机制与应用是否保留状态需要分开理解。|助手下一轮仍知道已修改哪些文件，是应用传递了相关状态。
stateless|Stateless|无状态|一次操作不依赖系统自动保留的先前交互信息。|“无状态”不表示每次请求都必须完全没有历史，而是系统不会自动把此前操作的信息带入下一次操作。调用者可以显式传入历史；应用也可以在模型之外存储会话，再按需组装请求。应用是否有状态与底层模型如何计算应分别理解。|新请求若不附带前文，模型就无法仅凭这次输入知道上一轮需求。
system-prompt|System prompt|系统提示词|应用提供给模型、用于设定角色、规则和行为边界的高优先级指令。|它可以包含输出规范、工具使用要求和任务原则。系统提示词影响模型行为，但权限隔离和安全限制仍应通过实际程序与环境实施。|要求助手先阅读项目规范、修改后运行检查。
turn|Turn|交互回合|从收到一条用户输入，到助手交还控制权的一段工作。|一个回合里可以发生多次模型请求和工具调用。回合长度取决于任务复杂度、智能体运行框架与停止条件。|用户说“修复测试”，助手读取、编辑、运行测试并汇报，属于一个回合。`,
`agent-mode|Agent mode|智能体模式|产品提供的一组行为与权限配置。|模式可能组合提示词、可用工具、自动执行策略等选项。名称相同的模式在不同产品里也可能有不同含义，需要看实际配置。|规划模式先分析方案；执行模式允许进行文件修改。
environment|Environment|运行环境|智能体通过工具读取或改变的外部世界。|环境可以包括文件、终端、浏览器、数据库和远程服务。模型只能从提供的信息中理解这些环境，不会自动知道屏幕或磁盘上的所有内容。|终端返回的测试日志，是智能体观察运行环境的一个入口。
filesystem|Filesystem|文件系统|按文件与目录组织、存储和访问数据的系统。|对编程智能体而言，文件系统承载代码、配置、测试和文档。能读写哪些位置由实际权限与沙箱决定。|助手读取 src 目录中的代码，并将修改保存回文件。
mcp|MCP|模型上下文协议|模型上下文协议（Model Context Protocol，MCP），用于连接 AI 应用与外部工具、数据和提示模板。|MCP 规定客户端与服务端如何发现和交换能力，常见能力包括工具、资源和提示模板。它是一套协议，不是某一个工具，也不是某个特定模型。建立连接不等于已经获得所有资源权限，授权与信任仍由具体系统处理。|通过 MCP 服务端向助手提供数据库查询工具。
permission-mode|Permission mode|权限模式|决定哪些操作可直接执行、哪些需要审批的一组规则。|这里的权限模式主要指智能体执行操作时的审批与授权策略，例如哪些命令可以直接运行、哪些需要确认。它不等同于操作系统用户权限，也不能单凭一段提示词实现。文件访问、网络和进程限制仍需要实际的程序或沙箱落实。|读取项目文件自动执行，执行生产发布命令需要审批。
permission-request|Permission request|操作授权请求|执行尚未获准的操作前，系统向用户或审批机制提出的授权申请。|操作授权请求应说明准备执行的操作、影响范围及必要原因。它是在请求批准一次操作或一类操作，不一定是在申请永久权限。批准范围与后续执行边界应由运行框架落实。|助手准备写入工作区之外的目录，系统要求确认该路径的写权限。
sandbox|Sandbox|沙箱|通过技术限制隔离程序运行和资源访问的环境。|沙箱可以限制文件、网络、进程或系统调用。其强度与边界取决于实现；它减少操作影响范围，但不是错误行为的万能防护。|在临时容器中运行未知项目的测试，隔离宿主机文件。
tool-call|Tool call|工具调用|模型或应用向工具执行系统发出的操作请求。|在模型工具调用中，请求通常包含工具名和参数。工具也可由应用程序直接调用；模型生成请求之后，还需要智能体运行框架检查权限、执行操作并返回结果；提出调用不代表操作已经成功。|模型输出一个读取 package.json 的工具请求。
tool-result|Tool result|工具返回结果|工具执行后返回给应用与模型的信息。|结果可能是文本、数据、图片或错误。它是后续决策的依据，需要区分操作成功、部分完成与失败；外部结果中的文字也不应被自动视为可信指令。|测试工具返回退出码和失败断言，助手据此继续排查。
tool|Tool|工具|供智能体调用、完成明确操作的程序接口。|工具可以只读，也可以产生写入、网络或其他副作用。设计工具时，清晰的参数、返回值和权限边界有助于减少误用。|搜索代码、执行命令、读取网页和写文件都可以封装为工具。`,
`attention-budget|Attention budget|注意力预算|描述模型在有限上下文和计算条件下分配关注程度的经验性说法。|“注意力预算”在本词典中是解释性比喻，不是所有模型都公开提供的固定指标，也不能按词元数量直接推算理解能力。它提醒我们：无关内容可能干扰重要信息的利用，精简并组织上下文往往比一味加长输入更有效。|把十万行无关日志放进对话，未必比提供关键错误片段更有效。
attention-degradation|Attention degradation|注意力退化|上下文变长或干扰增多时，模型利用相关信息的可靠性可能下降。|这里用“注意力退化”概括上下文增长或干扰增加时，模型利用信息的能力可能下降的现象。它不是一个适用于所有模型的单一机制或固定阈值；信息位置、任务类型、模型结构和提示组织都会影响结果。应通过实际任务评估，而不是仅按会话长度判断。|长会话后助手忘记格式约定，重新提供精简约束可帮助纠正。
attention-relationship|Attention relationship|注意力关联|在注意力机制中，某个位置按权重利用其他可见位置的信息的关系。|注意力机制会让一个位置按权重汇总其他位置的信息。“注意力关联”在这里用于解释这些位置之间的联系，并非独立的标准技术指标。全注意力涉及大量位置配对；自回归生成通常使用因果掩码，只能关注当前位置及此前的位置，不能看到尚未生成的内容。具体模型也可能采用稀疏或其他结构。注意力权重也不能直接等同于完整的思考原因。|生成变量引用时，前文的变量声明可能提供相关信息。
contextual-knowledge|Contextual knowledge|上下文知识|模型通过当前输入直接获得的信息。|它可以包含训练之后才出现的资料，也可以是私有项目事实。可靠性取决于资料质量、是否足够完整，以及模型是否正确使用。|刚发布的 API 文档被读取后，相关接口说明成为上下文知识。
hallucination|Hallucination|幻觉|模型生成了看似合理、实际缺乏依据或与事实矛盾的内容。|幻觉可能表现为编造接口、引用不存在的文件，或错误转述已提供的资料。流畅和自信不等于正确，关键结论应通过代码、文档或实际检查验证。|助手给出一个库里不存在的方法名，运行时才发现错误。
knowledge-cutoff|Knowledge cutoff|知识截止日期|用于描述模型训练知识覆盖时间范围的参考节点。|它不保证截止日前所有事实都被准确掌握，也不表示之后的信息完全不可用。新信息可通过工具与上下文提供，涉及最新版本时应查阅对应文档。|使用新发布的框架版本前，先读取该版本的官方迁移说明。
parametric-knowledge|Parametric knowledge|参数化知识|模型在训练中学到、通过参数表现出来的知识与模式。|“参数化知识”强调信息来自训练后的模型参数，常简称“参数知识”。它不是可逐条查看的可靠数据库，可能过时、缺漏或被错误组合。相对地，当前请求中提供的文档与事实属于上下文知识，不会因为被读取就自动写入权重。|模型无需读文档就能写常见排序算法，依赖的是训练中学到的模式。
smart-zone|Smart zone|高效工作状态|形容任务目标清楚、上下文干扰较少时，智能体工作比较稳定的经验性比喻。|Smart zone 在本词典中译作“高效工作状态”，描述工作状态，不是上下文窗口中的固定区段。它没有统一的词元阈值，更不保证新会话必然更聪明。清楚的目标、关键证据与及时交接比追求固定会话长度更有用。|任务切换前整理当前成果，减少旧需求对新任务的干扰。
sycophancy|Sycophancy|过度迎合|模型为迎合用户而过度附和，忽略事实、反例或独立判断的倾向。|Sycophancy 在 AI 语境中也常被称为“谄媚”或“迎合倾向”。这里使用“过度迎合”，强调问题不是礼貌，而是为赞同用户而牺牲准确性。例如接受错误前提、无依据地认同方案。要求说明证据、检验反例并实际验证有助于发现这种问题。|用户认为缓存一定出错，助手应验证证据，而不是直接认定缓存有问题。`,
`autocompact|Autocompact|自动上下文压缩|运行框架在达到条件时自动触发的上下文压缩。|它通常把部分历史整理成较短摘要，为后续请求腾出上下文空间。“自动”描述触发方式，不代表没有信息损失；阈值、摘要内容和能否取回原文由具体工具决定。这里不是压缩磁盘文件，也不一定意味着用户看到的会话被清空。|长时间编码后，系统用进展摘要替换部分早期对话。
clearing|Clearing|清空会话|移除当前交互历史，让后续工作从新的上下文开始。|清空通常不等于删除磁盘文件或外部记忆。需要继续任务时，应先保存目标、成果、未解决问题和验证方法。|完成一个功能后清空对话，再开始独立的新任务。
compaction|Compaction|上下文压缩|将已有交互压缩成更短表示，以节省上下文空间。|上下文压缩通过摘要、删减或其他较短表示减少历史占用。它是对交互信息的整理，不是对文件进行无损压缩。压缩可能保留目标和进展，却遗漏约束与证据；关键细节需要时应回到原始资料核实。自动上下文压缩与手动压缩的区别在于触发方式。|把多轮排查整理为“已验证原因、当前修改、下一步”。
handoff-artifact|Handoff artifact|交接材料|帮助后续执行者接续任务的持久记录。|好的交接材料包含目标、当前状态、已做决策、文件位置、已运行检查与剩余风险。它应足够独立，让新会话不用猜测缺失背景。|在 HANDOFF.md 中写明失败测试、复现命令及待验证方案。
handoff|Handoff|任务交接|将任务所需的信息与责任移交给另一个会话、智能体或人。|任务交接需要传递继续工作所需的上下文，并明确后续由谁执行。接收方可能是另一会话、智能体或人；可以通过交接材料、摘要或控制权转移实现。是否保留回复通道、是否共享文件与状态，取决于具体系统。|一个会话完成设计与接口说明，另一个会话根据交接材料实现功能。
primary-source|Primary source|一手资料|能够直接提供事实依据的原始材料。|对编码任务，一手资料通常包括实际源代码、原始日志、测试结果和对应版本的接口定义。即使是一手资料，也需要确认其时间、版本和适用范围。|直接查看失败测试输出，比只阅读别人对失败的概括更接近原始证据。
secondary-source|Secondary source|二手资料|对原始材料进行整理、解释或转述的内容。|摘要和教程便于快速理解，但可能简化细节、存在偏差或已经过时。遇到关键冲突时，应回到相关的一手资料核实。|会议纪要对原始讨论进行了压缩，未必保留每个限制条件。
spec|Spec|需求规格说明|说明要构建什么、有哪些约束，以及怎样判断完成的需求文档。|Spec 通常是 specification 的简称，本词典在跨会话开发语境中使用“需求规格说明”。它记录目标、范围、关键行为、约束和验收条件，再由任务单界定可执行的工作片段。它不同于实现方案；其他语境里的 spec 也可能指接口、协议或技术规范。|为登录功能规定：支持邮箱验证码、验证码过期后不可使用，并给出验收用例。
ticket|Ticket|任务单|界定一项可执行工作的目标、边界和验收条件的记录。|任务单也常被称为工单或工作项，用于明确一项可执行工作的背景、依赖、预期产出和验收方法。它可以属于某份需求规格说明，也可以独立存在。不要求每张任务单恰好占用一个会话，应按工作边界与验证方式拆分。|“为验证码增加过期校验，并补充过期与未过期用例”是一项具体任务。`,
`agents|AGENTS.md|AGENTS.md 指令文件|名为 AGENTS.md 的项目指令文件，用于向支持它的编程智能体说明项目约定。|AGENTS.md 是应保留原样的文件名，不是所有项目说明文档的统称。文件可包含目录结构、构建命令、代码约定与检查要求。是否自动读取、何时读取以及子目录文件的适用范围，由具体工具决定，不能假定所有助手都按同一规则加载。|在 AGENTS.md 中说明使用 pnpm，并列出修改后必须运行的检查。
context-pointer|Context pointer|上下文引用|指向其他资料位置、提示智能体按需读取的引用。|这里的 Context pointer 使用解释性译名“上下文引用”，不是程序内存地址。它可以是文件路径、链接或文档标识，并应说明何时需要读取。将入口说明保持简短，再引用专题资料，有助于按需补充上下文。|主说明写“涉及支付时，先阅读 docs/payments.md”。
memory-system|Memory system|记忆系统|把重要信息持久保存，并在后续任务中按需取回的机制。|记忆可以是文件、数据库或检索服务。它通常位于模型之外，需要处理更新、过期、冲突与访问权限，避免旧结论长期误导新任务。|助手把项目常用命令保存下来，在新的会话中重新加载。
progressive-disclosure|Progressive disclosure|渐进式呈现|先提供当前必需的信息，需要更多细节时再逐层展开。|Progressive disclosure 在界面设计中常译为“渐进式披露”；这里统一使用更直观的“渐进式呈现”。用于智能体时，指先读取简短索引，再按任务加载专题资料，避免一次塞入全部内容。始终必须遵守的关键约束仍应明确提供。|先读取技能简介，确定要操作表格后，再加载具体表格命令。
skill|Skill|智能体技能|为一类任务打包的指令、操作步骤和辅助资源。|智能体技能可包含说明、脚本、示例和模板，帮助助手采用可重复的工作流程。它不是重新训练得到的模型能力，也不等同于单个工具：技能描述怎么完成任务，工具执行其中的具体操作。支持开放 Agent Skills 格式的系统可按约定加载技能，其他系统的机制可能不同。|一个 PDF 技能规定生成后先渲染页面，再检查文字与排版。
subagent|Subagent|子智能体|由上层智能体委派、在独立任务上下文中执行工作的智能体。|它适合处理边界明确的调查或实现任务，再向上层返回结果。能否继续派生子智能体、是否共享文件以及如何隔离权限，取决于具体系统。|主智能体委派一个子智能体定位测试失败，自己继续整理实现方案。`,
`afk|AFK|无人值守运行|用户发起任务后，不持续在线陪同执行的工作方式。|AFK 是 Away From Keyboard 的缩写，原意是离开键盘；这里按开发语境使用“无人值守运行”。它描述人的参与方式，不是智能体权限模式，更不代表任何操作都已获授权。任务应有清楚的边界、完成条件和异常处理办法。|提交一项边界清楚的文档整理任务，稍后回来查看结果。
ax|AX|智能体体验|环境是否便于智能体发现信息、执行任务并判断结果。|AX 是 Agent Experience 的缩写。在这里，“智能体体验”指环境是否便于智能体发现资料、执行操作并获得可靠反馈，不是智能体有主观感受。清晰目录、可验证的命令和稳定工具接口通常有助于改善这种体验。|提供一条可重复执行的测试命令，让助手知道修改是否有效。
automated-check|Automated check|自动化检查|通过预定义程序判断结果是否符合明确条件。|常见检查包括测试、类型检查、格式检查与构建。检查覆盖的范围是有限的，通过所有检查也不等于产品没有其他问题。|CI 执行单元测试并根据退出码判断是否通过。
automated-review|Automated review|自动化审查|由 AI 等自动系统阅读产物、判断质量并提出问题的审查。|自动化审查是较宽泛的说法，也可包括静态分析等机制。本词典重点指由智能体或模型形成质量判断，例如审查代码差异。它不同于按预先规定条件输出通过或失败的自动化检查，可能存在误报或遗漏。最终仍应结合原始产物和可重复的检查结果判断。|另一个模型阅读差异，指出可能遗漏的异常分支。
dx|DX|开发者体验|人类开发者理解、修改、运行和维护项目的整体体验。|DX 是 Developer Experience 的缩写，指开发者理解、修改、运行和维护项目的整体体验。文档、反馈速度、错误信息、调试能力与接口一致性都会影响 DX。改善开发者体验常常也能帮助智能体，但两者并不完全相同。|新成员按 README 的两条命令就能启动项目。
dark-factory|Dark factory|黑灯软件工厂|用“黑灯工厂”比喻自动产出代码、缺少逐次人工代码审查的开发方式。|本词典使用“黑灯软件工厂”保留 Dark factory 的比喻意味，并限定在软件开发场景。它不是一种标准架构或成熟度认证，也不意味着完全没有负责人。这里特别强调代码产出不再逐次由人审查，因此仍需要明确验收、可观测性、失败恢复和责任边界。|低风险代码变更自动生成并验证，异常时升级给负责人。
design-concept|Design concept|设计构想|关于要做什么产品、提供怎样的体验及采用哪些核心取舍的设计构想。|本词典强调用户与智能体共同理解的设计构想，而不是某一份设计文件。“设计共识”是双方对构想达成理解后的状态，不宜直接替代 concept 的含义。可以通过场景、原型和验收条件把构想逐步具体化。|双方确认词典以探索关系为主，搜索用于快速定位术语。
grilling|Grilling|追问式澄清|用连续、具体的追问澄清需求，检验假设并推进设计决策的方法。|Grilling 在这里指一种追问式澄清的工作方法，并非正式技术协议：每次聚焦一个会影响实现的决定，用场景或反例检验理解。追问应减少重要歧义，不能把能够合理判断的小事全部交回给用户。|“搜索不到时，是建议相关词，还是允许创建新词条？”
human-review|Human review|人工审查|由人直接检查代码、界面或其他产物，并形成质量判断。|人工审查可以覆盖代码差异、交互行为、业务规则和测试证据。它与人工参与闭环不是同义词：审查是一类具体活动，后者是流程保留人工判断和反馈的组织方式。只阅读智能体总结，不能代替查看相应的原始产物。|开发者逐行查看认证逻辑的代码差异，验证权限边界。
human-in-the-loop|Human-in-the-loop|人工参与闭环|在工作流程中保留人的判断、反馈或审批环节。|Human-in-the-loop 常见译法包括“人在回路中”和“人类在环”；本词典用“人工参与闭环”帮助理解其含义。它描述人如何参与流程，不要求人逐条批准所有操作，也不专指代码审查。介入点应围绕真正需要判断的决策设置。|助手完成原型，用户体验后明确哪些交互需要调整。
prototyping|Prototyping|原型开发|用较低成本构建可体验的原型，以检验设计或技术假设。|Prototyping 是原型开发或原型制作这一活动，验证是它的主要目的之一，它既包含构建原型，也包含借助原型检验假设。原型应聚焦尚不确定的问题，标清模拟部分；能演示并不表示已经满足正式交付的质量条件。|先做可点击的搜索与详情页面，验证词典导航是否顺手。
software-factory|Software factory|软件工厂|将需求输入、执行、验证与交付组织成可重复运行的流程。|工作可能由事件或任务队列触发，智能体承担其中一些环节。流程仍需要明确质量门槛、责任归属和失败恢复方式。|收到已批准任务后，自动创建分支、实现、测试并提交审查。
vibe-coding|Vibe coding|氛围编程|主要靠自然语言描述和运行感觉来迭代 AI 生成代码的编程方式。|“氛围编程”是流行译名，也可理解为“凭感觉编程”。在这个词的原始、较狭义用法中，使用者主要接受生成结果、根据运行表现继续提需求，而很少阅读代码差异。日常使用中含义可能更宽；不能把所有认真审查代码的 AI 辅助开发都等同于氛围编程。|描述一个倒计时页面，运行后继续用对话调整布局和行为。`
];
const termAliases = {
  "cache-tokens": [
    "缓存 Token",
    "缓存词元",
    "缓存输入词元",
    "cached tokens"
  ],
  "effort": [
    "推理投入",
    "推理力度",
    "reasoning effort"
  ],
  "harness": [
    "agent harness",
    "运行支架",
    "运行框架"
  ],
  "inference": [
    "推断",
    "模型运行",
    "推理运行"
  ],
  "input-tokens": [
    "输入 token",
    "input token",
    "输入 Token"
  ],
  "model-provider-request": [
    "模型服务请求"
  ],
  "model-provider": [
    "模型提供商",
    "模型服务商",
    "模型服务方"
  ],
  "next-token-prediction": [
    "下一个词元预测",
    "下一个 token 预测",
    "下一 Token 预测"
  ],
  "non-determinism": [
    "非确定行为"
  ],
  "output-tokens": [
    "输出 token",
    "output token",
    "输出 Token"
  ],
  "parameters": [
    "权重",
    "weights"
  ],
  "mcp": [
    "Model Context Protocol"
  ],
  "permission-request": [
    "权限请求"
  ],
  "tool-result": [
    "工具结果"
  ],
  "contextual-knowledge": [
    "情境知识"
  ],
  "knowledge-cutoff": [
    "知识截止时间"
  ],
  "parametric-knowledge": [
    "模型内在知识",
    "参数知识"
  ],
  "smart-zone": [
    "高效上下文区"
  ],
  "sycophancy": [
    "谄媚",
    "迎合",
    "迎合倾向"
  ],
  "autocompact": [
    "自动整理上下文",
    "自动压缩"
  ],
  "spec": [
    "specification",
    "需求说明",
    "规格说明",
    "需求规格"
  ],
  "ticket": [
    "工单",
    "工作项"
  ],
  "agents": [
    "项目规范文件",
    "项目指令文件"
  ],
  "context-pointer": [
    "上下文指针"
  ],
  "progressive-disclosure": [
    "按需展开",
    "按需加载",
    "渐进式披露"
  ],
  "skill": [
    "Agent Skills",
    "技能包",
    "技能"
  ],
  "afk": [
    "Away From Keyboard",
    "离开键盘",
    "离席运行"
  ],
  "ax": [
    "Agent Experience"
  ],
  "automated-review": [
    "自动化审阅"
  ],
  "dx": [
    "Developer Experience"
  ],
  "dark-factory": [
    "黑灯工厂",
    "无人审码工厂"
  ],
  "design-concept": [
    "设计共识"
  ],
  "grilling": [
    "追问澄清"
  ],
  "human-review": [
    "人工审阅"
  ],
  "human-in-the-loop": [
    "人在回路",
    "人类在环",
    "HITL",
    "人在回路中"
  ],
  "prototyping": [
    "原型验证"
  ],
  "vibe-coding": [
    "凭感觉编程"
  ]
};
export const terms = groups.flatMap((text, category) => text.trim().split('\n').map(line => {
 const [id, en, name, summary, detail, example] = line.split('|');
 return { id, en, name, summary, detail, example, aliases:termAliases[id]||[], category: categories[category].id };
}));
const links = {
 'spec':['ticket','handoff-artifact','session','context','handoff','design-concept','agents','environment'],
 'agent':['model','harness','tool','context-window','system-prompt','session','turn','subagent'],
 'model':['parameters','training','inference','next-token-prediction','token','harness','model-provider'],
 'context-window':['context','token','input-tokens','compaction','attention-degradation','system-prompt'],
 'harness':['agent','model','tool-call','tool-result','permission-mode','system-prompt'],
 'mcp':['tool','harness','environment','permission-mode'],
 'skill':['progressive-disclosure','context-pointer','agents','tool'],
 'subagent':['agent','session','handoff','tool-result'],
 'hallucination':['parametric-knowledge','contextual-knowledge','knowledge-cutoff','automated-check'],
 'compaction':['autocompact','context-window','handoff','handoff-artifact','secondary-source'],
 'ticket':['spec','automated-check','handoff-artifact','session'],
 'memory-system':['stateful','stateless','filesystem','context-pointer','agents'],
 'tool-call':['tool','tool-result','harness','permission-request'],
 'prefix-cache':['cache-tokens','input-tokens','model-provider-request','system-prompt'],
 'vibe-coding':['prototyping','human-review','human-in-the-loop','automated-check'],
};
const supplementaryLinks = {
 'ai':['model','training'], 'cache-tokens':['input-tokens','prefix-cache'],
 'effort':['inference','output-tokens'], 'inference':['model-provider-request','training'],
 'input-tokens':['token','context'], 'model-provider-request':['model-provider','inference'],
 'model-provider':['model','inference'], 'next-token-prediction':['output-tokens','non-determinism'],
 'non-determinism':['automated-check','inference'], 'output-tokens':['token','next-token-prediction'],
 'parameters':['parametric-knowledge','training'], 'training':['knowledge-cutoff'],
 'context':['contextual-knowledge','input-tokens'], 'session':['turn','stateful'],
 'stateful':['stateless','session'], 'stateless':['model-provider-request'],
 'system-prompt':['agents','prefix-cache'], 'turn':['model-provider-request','tool-call'],
 'agent-mode':['permission-mode','agent'], 'environment':['filesystem','sandbox'],
 'filesystem':['sandbox','handoff-artifact'], 'permission-mode':['permission-request','sandbox'],
 'permission-request':['tool-call','human-in-the-loop'], 'sandbox':['tool'],
 'tool-result':['context','automated-check'], 'attention-budget':['context-window','attention-relationship'],
 'attention-degradation':['attention-budget','smart-zone'], 'attention-relationship':['next-token-prediction'],
 'contextual-knowledge':['parametric-knowledge','primary-source'], 'knowledge-cutoff':['training'],
 'smart-zone':['compaction','handoff'], 'sycophancy':['hallucination','human-review'],
 'autocompact':['compaction','harness'], 'clearing':['session','handoff-artifact'],
 'primary-source':['secondary-source','automated-check'], 'secondary-source':['contextual-knowledge'],
 'agents':['system-prompt','context-pointer'], 'context-pointer':['progressive-disclosure'],
 'progressive-disclosure':['memory-system'], 'afk':['software-factory','automated-check'],
 'ax':['dx','tool'], 'automated-check':['automated-review','human-review'],
 'automated-review':['human-review','software-factory'], 'dx':['prototyping'],
 'dark-factory':['software-factory','human-review'], 'design-concept':['prototyping','grilling'],
 'grilling':['spec','human-in-the-loop'], 'human-in-the-loop':['automated-review'],
 'software-factory':['ticket','automated-check']
};
const termsById=new Map(terms.map(t=>[t.id,t]));
const neighbors=new Map(terms.map(t=>[t.id,new Set()]));
const candidates=[];
for(const source of [links,supplementaryLinks])for(const [id,targets]of Object.entries(source))
 for(const target of targets)if(termsById.has(id)&&termsById.has(target)&&id!==target)candidates.push([id,target]);
// First connect each term to its curated choices, then fill remaining capacity.
// Apply the display limit to both endpoints so a relation never disappears on reversing it.
for(const onlyUnconnected of [true,false])for(const [a,b]of candidates){
 const x=neighbors.get(a),y=neighbors.get(b);
 if(x.size<9&&y.size<9&&(!onlyUnconnected||!x.size||!y.size)){x.add(b);y.add(a);}
}
export function related(term) {
 return [...(neighbors.get(term?.id)||[])].map(id=>termsById.get(id));
}
